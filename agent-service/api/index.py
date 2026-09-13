"""
Kameti agent-service — the Python half of the agent, deployed separately from
the Next.js app.

Why this exists: the project's original agent (see
src/lib/agent/kametiAgent.ts in the Next.js app) used the Strands
Agents SDK's TypeScript build with Amazon Bedrock. Bedrock has no free tier
and requires an AWS account with a card on file. The Strands *Python* SDK's
Gemini provider fully supports both tool calling and vision, and Google AI
Studio's Gemini API has a genuine no-card free tier — but the TypeScript
Gemini provider doesn't support tool calling yet. So the agent's reasoning
and tool-calling loop moved here, to Python.

Design: this service owns no database connection and no business logic of
its own. Every tool below is a thin HTTP call back to the Next.js app's
/api/internal/* routes, which wrap the exact same domain functions
(src/lib/domain/*.ts) the original TS tools called directly. That keeps a
single source of truth for business rules in one language, and this service
purely as "reasoning + tool-calling", which is what actually needed to move.

Deploy this as its own Vercel project (Python runtime, this file at
/api/index.py) — see README.md in this folder for why it's kept separate
from the Next.js app's own /api routes, and for the alternative of running
it on Render/Railway/Fly instead.
"""

import asyncio
import json
import os
import queue
import threading
from typing import Optional

import requests
from flask import Flask, Response, jsonify, request
from google import genai
from strands import Agent, tool
from strands.models.gemini import GeminiModel

app = Flask(__name__)

NEXTJS_BASE_URL = os.environ.get("NEXTJS_BASE_URL", "http://localhost:3000").rstrip("/")
INTERNAL_SECRET = os.environ.get("INTERNAL_AGENT_SECRET", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL_ID = os.environ.get("GEMINI_MODEL_ID", "gemini-2.5-flash")

SYSTEM_PROMPT = """
You are the Kameti Agent, an autonomous coordinator for a rotating community
savings circle (a "kameti" / ROSCA). Members contribute a fixed amount each
cycle, and the pooled pot goes to one member on a rotation.

Your job is to handle the routine coordination work so the human organizer
doesn't have to:
- Check each committee's payment status for the current cycle (get_committee_status).
- Send friendly, specific WhatsApp reminders to members who haven't paid yet (send_reminder).
- Verify receipt screenshots members submit against what they owe (verify_receipt).
- Record payments once they are confirmed (record_payment).
- Move a committee to its next cycle once everyone has paid (advance_cycle).

When a member submits a receipt image, always call verify_receipt first and
use its result to decide your next step yourself:
- If it clearly matches the expected amount, call record_payment.
- If it's unclear, doesn't match, or looks suspicious, call raise_decision —
  do not record a payment you aren't confident about.

Escalate to the human organizer with raise_decision ONLY when:
- A member's payment is more than 3 days overdue AND at least one reminder
  has already been sent this cycle.
- A payment or receipt looks inconsistent (wrong amount, unclear reference)
  and you cannot confidently confirm it yourself.
- A member appears to be trying to leave, pause, or dispute something.

For everything else — a member simply hasn't paid yet and isn't overdue,
or a first reminder is due — handle it yourself with send_reminder. Do not
escalate routine, in-policy situations; only bring the organizer genuinely
judgment-requiring decisions, and always explain your reasoning when you do.

Be concise. When you take an action, briefly state what you did and why.
""".strip()

RECEIPT_PROMPT_TEMPLATE = """
You are verifying a payment receipt screenshot submitted by a member of a community
savings committee (a "kameti"). The member is expected to have paid {expected_amount}.

Look at the image and determine:
- The amount shown as paid/transferred (a number, or null if unreadable)
- The transaction date (as shown in the image, or null)
- Any transaction/reference ID visible (or null)
- Whether this looks like a genuine payment confirmation/receipt for at least the
  expected amount (true/false)
- Your confidence in this reading: "high", "medium", or "low"
- A short note explaining your reasoning, especially if something looks off
  (wrong amount, blurry, doesn't look like a real receipt, wrong recipient, etc.)

Respond with ONLY a single JSON object and nothing else — no markdown fences, no
commentary before or after — in exactly this shape:
{{"detectedAmount": number|null, "detectedDate": string|null, "detectedReference": string|null, "matches": boolean, "confidence": "high"|"medium"|"low", "notes": string}}
""".strip()


def _internal_headers() -> dict:
    return {"x-internal-secret": INTERNAL_SECRET, "Content-Type": "application/json"}


def _internal_get(path: str, params: Optional[dict] = None) -> dict:
    resp = requests.get(f"{NEXTJS_BASE_URL}{path}", params=params, headers=_internal_headers(), timeout=25)
    resp.raise_for_status()
    return resp.json()


def _internal_post(path: str, body: dict) -> dict:
    resp = requests.post(f"{NEXTJS_BASE_URL}{path}", json=body, headers=_internal_headers(), timeout=25)
    resp.raise_for_status()
    return resp.json()


def _run_receipt_vision(image_url: str, expected_amount: float, auth_user: Optional[str] = None,
                         auth_pass: Optional[str] = None) -> dict:
    """Fetches a receipt image and asks Gemini's vision API to read and validate it."""
    auth = (auth_user, auth_pass) if auth_user and auth_pass else None
    img_resp = requests.get(image_url, auth=auth, timeout=25)
    img_resp.raise_for_status()
    mime_type = img_resp.headers.get("content-type", "image/jpeg").split(";")[0]

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model=GEMINI_MODEL_ID,
        contents=[
            {"inline_data": {"mime_type": mime_type, "data": img_resp.content}},
            RECEIPT_PROMPT_TEMPLATE.format(expected_amount=expected_amount),
        ],
    )

    text = (response.text or "").strip()
    cleaned = text
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip().rstrip("`").strip()

    parsed = json.loads(cleaned)

    return {
        "matches": bool(parsed.get("matches")),
        "detectedAmount": parsed.get("detectedAmount"),
        "detectedDate": parsed.get("detectedDate"),
        "detectedReference": parsed.get("detectedReference"),
        "confidence": parsed.get("confidence", "low"),
        "notes": parsed.get("notes", ""),
    }


# ---------------------------------------------------------------------------
# Tools — each mirrors one file in src/lib/agent/tools/*.ts, but calls back
# into the Next.js app's /api/internal/* routes instead of using Prisma
# directly (this service has no database of its own).
# ---------------------------------------------------------------------------

@tool
def get_committee_status(committee_id: str) -> dict:
    """Fetch the current status of a committee: its cycle progress, pot totals, and every
    member with their current payment status for this cycle. Use this first, before deciding
    whether reminders or escalation are needed."""
    print(f"\n🔎 [AGENT] Checking committee status for {committee_id}...")
    result = _internal_get("/api/internal/committee-status", {"committeeId": committee_id})
    print(f"   -> status retrieved: {json.dumps(result)[:300]}")
    return result


@tool
def send_reminder(committee_id: str, member_id: str, message: str) -> dict:
    """Send a polite WhatsApp payment reminder to a specific committee member. Use this for
    members who have not yet paid this cycle, before escalating to the human organizer."""
    print(f"\n📤 [AGENT DECISION] Sending WhatsApp reminder to member {member_id}")
    print(f"   Message: \"{message}\"")
    result = _internal_post("/api/internal/send-reminder", {
        "committeeId": committee_id,
        "memberId": member_id,
        "message": message,
    })
    print(f"   -> reminder sent")
    return result


@tool
def record_payment(committee_id: str, member_id: str, amount: float, method: str = "Bank transfer",
                    reference: Optional[str] = None, was_late: bool = False) -> dict:
    """Record a confirmed, verified payment from a member for the current cycle. Only call this
    after the amount has been confirmed (e.g. via verify_receipt) — this updates the committee pot
    and the member's on-time/late counters."""
    print(f"\n✅ [AGENT DECISION] Recording confirmed payment: member {member_id}, amount {amount}")
    result = _internal_post("/api/internal/record-payment", {
        "committeeId": committee_id,
        "memberId": member_id,
        "amount": amount,
        "method": method,
        "reference": reference,
        "wasLate": was_late,
    })
    print(f"   -> payment recorded, pot updated")
    return result


@tool
def raise_decision(committee_id: str, committee_name: str, type: str, title: str, description: str,
                    recommendation: str, evidence: dict, cycle_number: Optional[int] = None) -> dict:
    """Escalate to the human organizer. Use this ONLY for the cases described in your system
    prompt (e.g. a payment more than 3 days overdue after two reminders, a receipt that looks
    wrong, or a member requesting to leave). Never use this for routine, in-policy actions —
    handle those yourself with the other tools. Always include your reasoning as evidence and a
    clear, specific recommendation."""
    print(f"\n🚨 [AGENT DECISION] Escalating to human organizer: \"{title}\"")
    print(f"   Reason: {description}")
    print(f"   Recommendation: {recommendation}")
    return _internal_post("/api/internal/raise-decision", {
        "committeeId": committee_id,
        "committeeName": committee_name,
        "cycleNumber": cycle_number,
        "type": type,
        "title": title,
        "description": description,
        "recommendation": recommendation,
        "evidence": evidence,
    })


@tool
def advance_cycle(committee_id: str) -> dict:
    """Move a committee to its next cycle once every member has paid for the current one: closes
    out the current rotation entry, activates the next recipient, and resets payment status for
    the new cycle. This will refuse and explain why if anyone still owes money — check
    get_committee_status first."""
    print(f"\n🔄 [AGENT DECISION] Advancing committee {committee_id} to next cycle")
    result = _internal_post("/api/internal/advance-cycle", {"committeeId": committee_id})
    print(f"   -> cycle advanced")
    return result


@tool
def verify_receipt(image_url: str, expected_amount: float) -> dict:
    """Look at a payment receipt/screenshot image and check whether it shows a valid payment of at
    least the expected amount. Returns the detected amount, date, and reference, plus whether it
    matches. Use the result to decide your next step yourself: if it clearly matches, call
    record_payment; if it looks wrong, unclear, or suspicious, call raise_decision instead of
    guessing."""
    print(f"\n🖼️  [AGENT] Verifying receipt image (expecting {expected_amount})...")
    try:
        result = _run_receipt_vision(image_url, expected_amount)
        print(f"   -> Gemini read: amount={result.get('detectedAmount')}, "
              f"confidence={result.get('confidence')}, matches={result.get('matches')}")
        return result
    except Exception as error:  # noqa: BLE001 — surfaced to the agent as a tool result, not raised
        return {
            "matches": False,
            "detectedAmount": None,
            "detectedDate": None,
            "detectedReference": None,
            "confidence": "low",
            "notes": f"Could not verify the receipt: {error}",
        }


def _build_agent() -> Agent:
    """A fresh Agent per call, same reasoning as the original: each run gets a
    clean conversation/tool-call history."""
    model = GeminiModel(
        client_args={"api_key": GEMINI_API_KEY},
        model_id=GEMINI_MODEL_ID,
        params={"temperature": 0.3, "max_output_tokens": 2048},
    )
    return Agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=[get_committee_status, send_reminder, record_payment, raise_decision, verify_receipt, advance_cycle],
    )


def _check_secret() -> bool:
    provided = request.headers.get("x-internal-secret", "")
    return bool(INTERNAL_SECRET) and provided == INTERNAL_SECRET


# ---------------------------------------------------------------------------
# Live streaming — bridges Strands' async event stream (agent.stream_async)
# to a synchronous generator Flask can yield from as Server-Sent Events.
# This forwards the agent's *actual* reasoning as it happens (text deltas and
# tool calls as they're chosen), not a replay of a finished response — the
# frontend renders exactly what arrives here, live.
#
# Note: Strands' exact event dict shape can vary slightly by SDK version.
# _event_to_sse below reads the common keys defensively; if your installed
# version differs, check this service's terminal output (each raw event is
# still printed) and adjust the key names below to match.
# ---------------------------------------------------------------------------

_SENTINEL = object()


def _stream_agent_events(agent: Agent, prompt: str):
    """Runs agent.stream_async on a background thread with its own event
    loop, pushing each event into a thread-safe queue this generator reads
    from synchronously — necessary because Flask's dev server is sync but
    Strands' streaming API is async."""
    q: "queue.Queue" = queue.Queue()

    def _runner():
        async def _consume():
            try:
                async for event in agent.stream_async(prompt):
                    q.put(event)
            except Exception as exc:  # noqa: BLE001 — surfaced to the client, not raised
                q.put({"error": str(exc)})
            finally:
                q.put(_SENTINEL)

        asyncio.run(_consume())

    threading.Thread(target=_runner, daemon=True).start()

    while True:
        item = q.get()
        if item is _SENTINEL:
            return
        yield item


def _event_to_sse(event: dict) -> Optional[str]:
    """Converts one raw Strands stream event into an SSE line for the
    browser. Forwards whatever meaningful content is present rather than
    assuming one exact schema."""
    print(f"   [stream event] {str(event)[:200]}")
    payload = None

    if isinstance(event, dict):
        if event.get("error"):
            payload = {"type": "error", "text": event["error"]}
        elif event.get("data"):
            payload = {"type": "text", "text": event["data"]}
        elif event.get("current_tool_use", {}).get("name"):
            payload = {"type": "tool_call", "name": event["current_tool_use"]["name"]}
        elif isinstance(event.get("message"), dict):
            for block in event["message"].get("content", []) or []:
                if isinstance(block, dict) and block.get("text"):
                    payload = {"type": "text", "text": block["text"]}
                    break

    if payload is None:
        return None
    return f"data: {json.dumps(payload)}\n\n"


# ---------------------------------------------------------------------------
# HTTP surface — called by the Next.js app instead of it running the agent
# in-process. Mirrors src/app/api/agent/run/route.ts's manual-trigger and
# cron paths, plus the Twilio webhook's text-reply path.
# ---------------------------------------------------------------------------

@app.route("/api/run", methods=["POST"])
def run_endpoint():
    if not _check_secret():
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(force=True)
    committee_name = body["committeeName"]
    committee_id = body["committeeId"]
    current_cycle = body.get("currentCycle")
    total_cycles = body.get("totalCycles")

    print(f"\n{'='*60}\n🤖 AGENT RUN STARTING — committee: {committee_name} (cycle {current_cycle}/{total_cycles})\n{'='*60}")
    agent = _build_agent()
    prompt = (
        f'Check committee "{committee_name}" (id: {committee_id}), cycle {current_cycle} of '
        f'{total_cycles}. Take whatever actions are appropriate: send reminders to members '
        f"who haven't paid, or raise a decision if something needs the organizer's attention. If "
        f"everyone has paid, consider calling advance_cycle."
    )
    result = agent(prompt)
    print(f"\n{'='*60}\n✅ AGENT RUN COMPLETE\nFinal reasoning: {str(result)}\n{'='*60}\n")
    return jsonify({"ok": True, "summary": str(result)})


@app.route("/api/run/stream", methods=["POST"])
def run_stream_endpoint():
    """Same job as /api/run, but streams the agent's reasoning live as
    Server-Sent Events instead of waiting for the whole turn to finish."""
    if not _check_secret():
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(force=True)
    committee_name = body["committeeName"]
    committee_id = body["committeeId"]
    current_cycle = body.get("currentCycle")
    total_cycles = body.get("totalCycles")

    prompt = (
        f'Check committee "{committee_name}" (id: {committee_id}), cycle {current_cycle} of '
        f'{total_cycles}. Take whatever actions are appropriate: send reminders to members '
        f"who haven't paid, or raise a decision if something needs the organizer's attention. If "
        f"everyone has paid, consider calling advance_cycle."
    )

    def generate():
        print(f"\n{'='*60}\n🤖 AGENT STREAM STARTING — {committee_name}\n{'='*60}")
        agent = _build_agent()
        yield f"data: {json.dumps({'type': 'start', 'text': f'Checking {committee_name}…'})}\n\n"
        try:
            for event in _stream_agent_events(agent, prompt):
                sse_line = _event_to_sse(event)
                if sse_line:
                    yield sse_line
        except Exception as exc:  # noqa: BLE001
            yield f"data: {json.dumps({'type': 'error', 'text': str(exc)})}\n\n"
        print(f"{'='*60}\n✅ AGENT STREAM COMPLETE\n{'='*60}\n")
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.route("/api/message", methods=["POST"])
def message_endpoint():
    if not _check_secret():
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(force=True)
    agent = _build_agent()
    prompt = (
        f'Member "{body["memberName"]}" (id: {body["memberId"]}) from committee '
        f'"{body["committeeName"]}" (id: {body["committeeId"]}) just replied on WhatsApp: '
        f'"{body["message"]}". Decide whether this needs anything from you — for example, '
        f"raise a decision if they're asking to leave, pause, or dispute a charge. If it's just a "
        f"routine acknowledgement, no action is needed."
    )
    result = agent(prompt)
    return jsonify({"ok": True, "summary": str(result)})


@app.route("/api/verify-receipt", methods=["POST"])
def verify_receipt_endpoint():
    """Called directly by the Twilio webhook's photo path (src/lib/domain/receipts.ts),
    bypassing the agent loop since this is a single vision call, not a multi-step task."""
    if not _check_secret():
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(force=True)
    try:
        result = _run_receipt_vision(
            body["imageUrl"],
            body["expectedAmount"],
            body.get("authUser"),
            body.get("authPass"),
        )
        return jsonify(result)
    except Exception as error:  # noqa: BLE001
        return jsonify({
            "matches": False,
            "detectedAmount": None,
            "detectedDate": None,
            "detectedReference": None,
            "confidence": "low",
            "notes": f"Could not verify the receipt: {error}",
        })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "model": GEMINI_MODEL_ID})
