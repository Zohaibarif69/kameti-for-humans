# Kameti for Humans

Kameti for Humans is a management app for a **kameti** (also called a ROSCA — rotating savings and credit association): a group of people who each contribute a fixed amount on a regular schedule into a shared pot, which then goes to one member per cycle until everyone has had a turn.

Running one by hand means constantly chasing people for money on WhatsApp, squinting at receipt screenshots, and manually tracking whose turn is next. This app hands that coordination work to an AI agent — it checks who's paid, sends reminders, reads receipt photos, records confirmed payments, and only pulls in the human organizer when something actually needs a judgment call.

## How it works

Each **committee** is one kameti: a fixed contribution amount, a frequency (weekly/biweekly/monthly), a list of members, and a rotation order for who receives the pot each cycle.

On a schedule (or on demand), the **agent** runs a pass over every active committee:

1. Checks each committee's current cycle: who has paid, who hasn't, who's overdue.
2. Sends a WhatsApp reminder to members who haven't paid yet.
3. When a member replies to a reminder — with text or a photo of a receipt — the agent reads it:
   - A **receipt photo** goes through vision-based verification against the amount the member owes. If it clearly matches, the agent records the payment itself.
   - **Free text** (a question, a dispute, "I need to skip this month") goes to the same agent so it gets handled with the same policy as everything else.
4. Once every member has paid for the cycle, the agent advances the committee to the next cycle and rotation slot.
5. The agent only escalates to a human — via a **Decision** the organizer approves or dismisses on the Decisions page — when a payment is more than 3 days overdue *after* a reminder, a receipt looks inconsistent or unclear, or a member seems to be trying to leave or dispute something. Everything routine, it just handles.

The web app itself (Dashboard, Committees, Committee Detail, Payments, Members, Agent, Decisions) is where the organizer watches all of this happen, manually records a payment or edits a committee/member when needed, and reviews whatever the agent escalates.

## Architecture: two deployable services

This is **not** a single app — it's a Next.js app plus a separate Python service, deployed independently and talking to each other over HTTP with a shared secret. That split exists for a specific, non-obvious reason (see below), and matters for anyone setting this up.

```
Next.js app (this repo's root)          agent-service/ (separate deploy)
───────────────────────────             ─────────────────────────────
Frontend (all pages)                     Strands Agent (Python)
  reads via GET /api/state                 + Gemini (reasoning + tool calls)
  writes via /api/committees,
  /api/members, /api/payments,
  /api/decisions/[id]

/api/agent/run  ──POST /api/run────────▶
/api/webhooks/twilio
  (text)       ──POST /api/message────▶
  (photo)  (verifyReceiptImage) ─POST /api/verify-receipt▶
                                            │
/api/internal/*  ◀───────HTTP calls────────┘
  committee-status, send-reminder,        (every tool call reads/writes
  record-payment, raise-decision,          data by calling back into the
  advance-cycle                            Next.js app — the Python side
  (guarded by a shared secret)             owns no database connection)
```

**Why two services instead of one:** the agent's design depends on tool-calling — six discrete tools (check status, send reminder, verify receipt, record payment, raise decision, advance cycle) with an escalation policy governing when the model may act on its own versus when it must ask a human. The original build used the **TypeScript** Strands Agents SDK with Amazon Bedrock, which works but requires an AWS account and a card on file even to use free credits. Strands' **Python** SDK has a complete Gemini integration with both tool-calling and vision support, and Google AI Studio's Gemini API has a genuine no-card-required free tier — but the **TypeScript** Gemini provider doesn't support tool calling yet. Since tool calling is the entire point of this agent's design, the fix wasn't a config change, it was moving just the reasoning loop to Python.

Nothing about the business logic changed in that move. The Python service owns no database connection and duplicates no domain logic — every tool it has is a thin HTTP call back into this app's `/api/internal/*` routes, which wrap the exact same `src/lib/domain/*.ts` functions. The one exception is receipt verification, which is now a direct Gemini vision call from the Python side (`agent-service/api/index.py`), replacing what used to be a direct Bedrock `ConverseCommand` call from `src/lib/domain/receipts.ts` (that file now just makes an HTTP call to the agent-service instead).

**The original TS/Bedrock agent is still in this repo, but inert.** `src/lib/agent/kametiAgent.ts` and `src/lib/agent/tools/*.ts` are kept as a reference and a documented revert path (see `agent-service/README.md`'s "Reverting to Bedrock" section) — they are not called by any route anymore. If you're reading the code and wondering why `AWS_REGION`/`BEDROCK_MODEL_ID` exist but nothing seems to call Bedrock, that's why.

They're kept as two separate deployments deliberately, not merged into one repo's `/api` folder: Next.js's App Router already owns the `/api` route namespace, and mixing a Python runtime into the same tree on Vercel is a known source of routing conflicts.

## Tech stack

- **Main app:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Database/ORM:** PostgreSQL + Prisma
- **Messaging:** Twilio (WhatsApp)
- **agent-service:** Python, Flask, [Strands Agents SDK](https://github.com/strands-agents) (Python build) with a Gemini model provider
- **Validation:** Zod

## Data model

Defined in `prisma/schema.prisma`, mirroring the shapes in `src/types/index.ts` so the frontend never had to change when mock data became a real database:

| Model | Purpose |
|---|---|
| `Committee` | One kameti: contribution amount, frequency, cycle count/progress, status, pot totals |
| `Member` | A committee member: contribution, phone (for WhatsApp), language, payment-status counters |
| `CyclePaymentRecord` | Per-member, per-cycle payment history |
| `RotationEntry` | The payout order: who receives the pot on which cycle |
| `Payment` | An individual payment record: expected vs. received amount, status, receipt URL, verification metadata |
| `AgentAction` | Audit log of everything the agent does (reminders sent, payments recorded, receipts verified, cycles advanced) |
| `Decision` | An escalation raised for the human organizer, with evidence and a recommendation, pending approval/resolution |
| `Notification` | In-app notifications shown to the organizer |

## API surface (main app)

**Frontend-facing:**

| Route | Purpose |
|---|---|
| `GET /api/state` | One aggregate call returning everything the frontend needs, shaped to match `src/types/index.ts` exactly |
| `GET /api/committees` | Committee list |
| `POST /api/committees` · `PATCH`/`DELETE /api/committees/[id]` | Create/edit/delete a committee |
| `POST /api/committees/[id]/members` · `PATCH`/`DELETE /api/members/[id]` | Create/edit/delete a member |
| `POST /api/payments` | Manually record a payment from the UI |
| `PATCH /api/decisions/[id]` | Approve/dismiss a pending decision |
| `POST /api/agent/run` | Manually trigger an agent pass (the Agent page's "Run agent check" button) |
| `GET /api/agent/run` | Scheduled trigger — called by Vercel Cron every 6 hours (`vercel.json`) |
| `POST /api/agent/run-stream` | Streaming variant, for showing live agent progress in the UI |

**Internal, called only by `agent-service`** (guarded by a shared-secret header, see [Auth between the two services](#auth-between-the-two-services)):

| Route | Purpose |
|---|---|
| `GET /api/internal/committee-status` | A committee's live status, for the agent to reason over |
| `POST /api/internal/send-reminder` | Send (or, unconfigured, log) a WhatsApp reminder |
| `POST /api/internal/record-payment` | Record a confirmed payment |
| `POST /api/internal/raise-decision` | Create a Decision for the organizer to review |
| `POST /api/internal/advance-cycle` | Move a committee to its next cycle once everyone's paid |

**Inbound webhook:**

| Route | Purpose |
|---|---|
| `POST /api/webhooks/twilio` | Twilio's "message received" webhook — routes a receipt photo through vision verification, or free text through the full agent, depending on what came in |

## Auth between the two services

The `/api/internal/*` routes have no auth in front of them besides a shared secret: every request must carry a matching `x-internal-secret` header (checked in `src/lib/internalAuth.ts`, which **fails closed** — if the secret isn't configured on the server, the routes return 500 rather than silently allowing unauthenticated access). Set `INTERNAL_AGENT_SECRET` to the same value in both this app's env and `agent-service`'s env.

**The inbound Twilio webhook (`/api/webhooks/twilio`) is the one open door:** it doesn't currently validate Twilio's `X-Twilio-Signature` header, so anyone who knows the webhook URL could POST to it. Add signature validation before pointing this at real user data.

## Setup

### 1. Main app

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Needed for |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon or Supabase's free tier are the fastest way to get one) |
| `AGENT_SERVICE_URL` | Where `agent-service` is running (`http://localhost:8000` for local dev) |
| `INTERNAL_AGENT_SECRET` | Shared secret — generate with `openssl rand -hex 32`, must match `agent-service`'s copy |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` | Real WhatsApp sends — leave blank to run in mock mode (reminders logged to the console instead) |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `BEDROCK_MODEL_ID` | Only needed if you revert to the legacy TS/Bedrock agent — not read while `AGENT_SERVICE_URL` is set |

```bash
npx prisma db push     # creates tables from prisma/schema.prisma
npm run db:seed        # loads src/mocks/data.ts as real rows
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 2. agent-service

```bash
cd agent-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `agent-service/.env`:

| Variable | Needed for |
|---|---|
| `GEMINI_API_KEY` | Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no card required |
| `GEMINI_MODEL_ID` | Defaults to `gemini-2.5-flash` |
| `NEXTJS_BASE_URL` | The main app's URL (`http://localhost:3000` for local dev) |
| `INTERNAL_AGENT_SECRET` | Must exactly match the main app's value |

```bash
flask --app api/index run --port 8000
curl http://localhost:8000/api/health   # sanity check
```

### 3. Trigger the agent

```bash
curl -X POST http://localhost:3000/api/agent/run
```

Same call the Agent page's "Run agent check" button makes, and the same one Vercel Cron makes automatically every 6 hours.

### 4. Wiring up real WhatsApp (Twilio Sandbox)

1. Create a free Twilio account and join your number to the WhatsApp Sandbox (Console → Messaging → Try it out → Send a WhatsApp message).
2. Set the three `TWILIO_*` variables in the main app's `.env`.
3. In the Sandbox settings, set "WHEN A MESSAGE COMES IN" to `https://<your-deployed-url>/api/webhooks/twilio` — this needs a public URL, so use `ngrok` for local testing.
4. Reply to a reminder from a seeded member's WhatsApp number, or send a photo — the webhook records the payment or raises a decision depending on what the vision model reads.
