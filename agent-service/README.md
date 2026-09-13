# Kameti agent-service

A small Python service that runs the Kameti Agent's reasoning and tool-calling
on the **Strands Agents SDK (Python) + Google Gemini**, instead of the
original TypeScript implementation on Amazon Bedrock.

## Why this exists

The original agent (`src/lib/agent/kametiAgent.ts` in the main app) used the
**TypeScript** build of the Strands Agents SDK with `BedrockModel`. That works,
but Amazon Bedrock has no free tier and AWS requires a card on file even to
use free credits.

Strands' **Python** SDK has a Gemini provider with full tool-calling *and*
vision support, and Google AI Studio's Gemini API has a genuine free tier —
no card required. The catch: the **TypeScript** Gemini provider doesn't
support tool calling yet. Since this project's whole agent design (six tools,
an escalation policy) depends on tool calling, the fix isn't a config change —
it's moving just the agent's reasoning loop to Python, where Gemini's
integration is complete.

## What actually changed vs. the original design

Nothing about the business logic. This service owns **no database
connection** and duplicates **no domain logic**. Every tool here
(`get_committee_status`, `send_reminder`, `record_payment`, `raise_decision`,
`advance_cycle`) is a thin HTTP call back to new `/api/internal/*` routes on
the main Next.js app, which wrap the exact same `src/lib/domain/*.ts`
functions the original TS tools called directly. `verify_receipt` is the one
exception — it's now a direct Gemini vision call here instead of a Bedrock
`ConverseCommand` call, since that's the whole point of the swap.

The old TS/Bedrock agent (`src/lib/agent/kametiAgent.ts` and
`src/lib/agent/tools/*.ts`) is still in the repo, unused, as a reference and
an easy revert path — see "Reverting to Bedrock" below.

## Architecture

```
Next.js app (Vercel)                    agent-service (separate deploy)
─────────────────────                   ──────────────────────────────
/api/agent/run  ──POST /api/run────────▶  Strands Agent (Python)
/api/webhooks/twilio                       + GeminiModel (tool calling)
  (text reply) ──POST /api/message──────▶
  (photo)      ──POST /api/verify-receipt▶ Gemini vision (direct call)
                                              │
/api/internal/*  ◀────HTTP calls─────────────┘  (tools call back in for
  (committee-status, send-reminder,               all DB reads/writes)
   record-payment, raise-decision,
   advance-cycle)
```

## Local setup

```bash
cd agent-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GEMINI_API_KEY and INTERNAL_AGENT_SECRET
```

Get a free `GEMINI_API_KEY` at <https://aistudio.google.com/apikey> — no card
needed.

Generate a shared secret and put the **same value** in this service's `.env`
and the main app's `.env`:

```bash
openssl rand -hex 32
```

Run it locally:

```bash
flask --app api/index run --port 8000
```

In the main app's `.env`, point `AGENT_SERVICE_URL` at `http://localhost:8000`.

Sanity check:

```bash
curl http://localhost:8000/api/health
```

## Deploying

**Option A — a second Vercel project (recommended).** Push this
`agent-service/` folder as its own repo (or a separate Vercel project pointed
at this subdirectory), set the same three env vars in Vercel's dashboard, and
deploy. Vercel's Python runtime picks up `requirements.txt` and
`api/index.py` automatically. Set `NEXTJS_BASE_URL` to your deployed Kameti
app's URL.

Deliberately **not** merged into the main Next.js repo's own `/api` folder:
Next.js's App Router already owns the `/api` route namespace in that project,
and mixing a Python runtime into the same `/api` tree on Vercel is a known
source of routing conflicts and 404s. Two small deployments is simpler than
one fragile one.

**Option B — Render, Railway, or Fly.io free tier.** Any host that runs a
standard Flask app works — `gunicorn api.index:app` as the start command.

Either way, once deployed:
1. Set `AGENT_SERVICE_URL` in the **main app's** env to this service's URL.
2. Set `INTERNAL_AGENT_SECRET` to the same value in **both** services.
3. Redeploy the main app so it picks up the new env vars.

## Reverting to Bedrock

If you'd rather go back to the original single-repo TS/Bedrock agent:
1. In `src/app/api/agent/run/route.ts`, replace the `callAgentService` call
   with `createKametiAgent().invoke(...)` (see git history for the exact
   original).
2. In `src/app/api/webhooks/twilio/route.ts`, do the same for the text-reply
   branch.
3. In `src/lib/domain/receipts.ts`, restore the direct
   `BedrockRuntimeClient`/`ConverseCommand` implementation (see git history).
4. Set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and
   `BEDROCK_MODEL_ID` again in the main app's env.
5. This `agent-service/` folder and its deployment can be torn down.

## Known limitations

- Gemini's free tier has real rate limits (see Google AI Studio's current
  quotas) — fine for a hackathon demo's traffic, not for production load.
- There's a known upstream issue where some Gemini + Strands + free-tier-key
  combinations can throw on tool-call responses
  (strands-agents/sdk-python#1024). If you hit this, pin `google-genai` to
  the version in `requirements.txt` and check the issue for the current
  status before assuming your own code is at fault.
- Like the rest of this project, there's no automated test suite covering
  this service yet.
