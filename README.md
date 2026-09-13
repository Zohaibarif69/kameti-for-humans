# Kameti — Next.js Edition

This is the Next.js (App Router) port of the original Vite + React Router "Kameti"
frontend prototype. All UI, styling, and business logic are unchanged — only the
routing/framework layer was converted.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # next lint
```

## Project structure

```
src/
  app/
    layout.tsx              Root layout — global CSS, <AppProvider>, page metadata
    globals.css              Tailwind v4 import + design tokens (from index.css)
    page.tsx                  Landing page ("/")
    (app)/                    Route group: everything inside the app shell
      layout.tsx               Renders <AppLayout> (sidebar/topbar/bottom nav)
      dashboard/page.tsx
      committees/page.tsx
      committees/[committeeId]/page.tsx
      payments/page.tsx
      agent/page.tsx
      decisions/page.tsx
      members/page.tsx
      settings/page.tsx
      help/page.tsx
      [...notfound]/page.tsx   Catch-all 404 within the app shell
  components/
    layout/                  Sidebar, TopBar, BottomNav, AppLayout
    ui/                      Button, Card, Badge, Modal, Drawer, Toast, etc.
  context/
    AppContext.tsx           App-wide state (mock data, toasts, decisions, etc.)
  mocks/
    data.ts                  Mock committees/members/payments/agent activity
  types/
    index.ts                 Shared TypeScript types
```

## Notes on the conversion

- `react-router`'s `Link`/`NavLink` → `next/link`'s `Link` (`to` prop → `href`)
- `useLocation()` → `usePathname()` (from `next/navigation`)
- `useParams()` → `next/navigation`'s `useParams()`
- Route-group layout (`(app)/layout.tsx`) replaces the old `<Outlet />`-based
  `AppLayout` wrapper — it now takes `children` directly, per Next.js convention
- All client-interactive files (state, context, browser events) are marked
  `'use client'`, since Next.js Server Components are the default
- Imports use the `@/*` path alias (mapped to `src/*` in `tsconfig.json`)
  instead of relative `../../..` chains
- No backend, auth, or database — this remains a fully mocked UI prototype,
  exactly as before

## The real agent backend (Strands Agents SDK)

This project now also includes a real, working backend for the **AWS "Agents
for Humans" hackathon** (Good Neighbor track) — the mock data can be replaced
by an actual Strands agent that monitors committees, sends WhatsApp
reminders, and escalates real decisions to the organizer.

### What's here

```
prisma/
  schema.prisma        Postgres schema mirroring src/types/index.ts
  seed.ts               Loads src/mocks/data.ts into the real database
src/lib/
  db.ts                  Prisma client singleton
  twilio.ts              WhatsApp sender (mocks to console.log if unconfigured)
  domain/                 Shared business logic, used by both the agent's tools
                          and the REST API routes (no duplicated logic):
    payments.ts             recordPayment()
    decisions.ts             raiseDecision(), resolveDecision()
    cycles.ts                advanceCycle()
    receipts.ts              verifyReceiptImage() — Bedrock vision call
  agent/
    kametiAgent.ts         The Strands Agent: system prompt + tool set
    tools/
      getCommitteeStatus.ts  Reads a committee's live status
      sendReminder.ts        Sends a WhatsApp reminder, logs the action
      recordPayment.ts       Records a confirmed payment, updates the pot
      raiseDecision.ts       Escalates to the organizer (the Decisions page)
      verifyReceipt.ts       Reads a receipt screenshot via Bedrock vision
      advanceCycle.ts        Moves the rotation forward once everyone's paid
src/app/api/
  state/route.ts              GET  — aggregate data for the whole frontend
  committees/route.ts         GET  — committee list (subset of /api/state)
  payments/route.ts           POST — manually record a payment (from the UI)
  decisions/[decisionId]/route.ts  PATCH — approve/resolve a decision (from the UI)
  agent/run/route.ts          POST — manual trigger; GET — scheduled trigger
  webhooks/twilio/route.ts    POST — inbound WhatsApp (replies + receipt photos)
vercel.json             Cron config — runs /api/agent/run every 6 hours
```

### Setup

1. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a Postgres connection string (Neon or Supabase's free
     tier is the fastest way to get one)
   - AWS credentials for Bedrock (`AWS_REGION`, `AWS_ACCESS_KEY_ID`,
     `AWS_SECRET_ACCESS_KEY`) — needs model access enabled for Claude on
     Bedrock in your account (used for both the agent's reasoning and the
     receipt-verification vision calls)
   - Twilio credentials, if you want real WhatsApp sends — leave blank to
     run in mock mode (reminders are logged to the console instead)

2. Install dependencies and generate the Prisma client:
   ```bash
   npm install
   npx prisma db push     # creates the tables from prisma/schema.prisma
   npm run db:seed        # loads the existing mock data as real rows
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Trigger the agent manually (great for demos) — same call the frontend's
   "Run agent check" button (on the Agent page) makes, and the same one a
   scheduler would make automatically:
   ```bash
   curl -X POST http://localhost:3000/api/agent/run
   ```

### Wiring up real WhatsApp (Twilio Sandbox)

1. Create a free Twilio account and join your number to the WhatsApp
   Sandbox (Console → Messaging → Try it out → Send a WhatsApp message).
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_FROM`
   in `.env`.
3. In the Sandbox settings, set "WHEN A MESSAGE COMES IN" to:
   `https://<your-deployed-url>/api/webhooks/twilio` (needs a public URL —
   use `ngrok` for local testing).
4. Reply to a reminder from a seeded member's WhatsApp number, or send a
   photo — the webhook will either record the payment or raise a decision,
   depending on what the vision model reads.

> Note: the webhook does not currently validate Twilio's request signature
> (`X-Twilio-Signature`) — add that before pointing it at real user data.

### Scheduling the agent

- **Vercel**: `vercel.json` already configures a cron hitting `/api/agent/run`
  every 6 hours — this works automatically once deployed to Vercel.
- **AWS**: point an EventBridge Scheduler rule at the same URL with an HTTP
  GET target, on whatever interval you prefer.

### What's fully wired end-to-end

- Every page (Dashboard, Committees, Committee Detail, Payments, Members,
  Agent, Decisions) reads real data through `/api/state`, via `AppContext` —
  no page needed any code changes, since they only ever consumed data
  through `useApp()`.
- Approving/dismissing a decision on the Decisions page writes back to the
  database via `/api/decisions/[id]`.
- Recording a payment from the Committee Detail page's "Record payment"
  modal writes to the database via `/api/payments`.
- The Agent page's "Run agent check" button triggers a real agent pass and
  refreshes the UI with the results.
- **Creating, editing, and deleting committees and members** — the "New
  committee" button (Committees page), "Manage committee" button (Committee
  Detail page header), "Add member" button (Committee Detail page, Members
  tab), and "Edit" button (on any member's detail drawer, from either the
  Committee Detail or the global Members page) were all already in the UI
  but inert — they're now wired to real endpoints:
  - `POST /api/committees` + `PATCH` / `DELETE /api/committees/[id]`
  - `POST /api/committees/[id]/members` + `PATCH` / `DELETE /api/members/[id]`
  
  Deleting either shows an inline "are you sure?" confirmation in the same
  modal before it happens — there is no undo (cascade deletes in the schema
  clean up related payments/rotation entries/agent activity). Deleting the
  committee you're currently viewing redirects you back to the Committees
  list. These share two form components, `src/components/forms/CommitteeFormModal.tsx`
  and `src/components/forms/MemberFormModal.tsx`, each used in "create",
  "edit", and "delete" mode so the logic isn't duplicated across pages.

### What's still manual / not built

- Twilio's inbound webhook does not validate request signatures (see above).
- No automated tests.


