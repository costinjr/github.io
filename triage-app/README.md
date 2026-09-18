# Northstar Triage Demo

Company Intake Triage Tool — a synthetic-data-only demo for a fictional
specialty clinic. Staff paste a messy inbound referral or use a short form;
the tool extracts the facts, checks completeness, and applies written triage
rules to assign priority, owner, and due time. See `CLAUDE.md` for the
project guardrails.

This covers Sessions 1–5 of the build: the app shell, navigation, a demo
passcode gate, the Supabase Postgres schema with a synthetic seed/reset,
intake and referral detail views, and an AI extraction contract. The rules
engine that turns extraction into priority, owner, and due time is added in
a later session.

## Local setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo passcode gate

Set `DEMO_PASSCODE` in `.env.local` to require a shared passcode before any
page loads (enforced in `proxy.ts`, stored as a hashed value in a secure,
`httpOnly` cookie). This is friction against casual visitors, not production
security. If `DEMO_PASSCODE` is left unset, the gate is disabled and every
page is reachable directly — useful for local development.

### Database (Supabase Postgres)

1. Create a Supabase project and copy its Postgres connection string
   (Project Settings > Database > Connection string > URI).
2. Set `DATABASE_URL` in `.env.local` to that connection string.
3. Apply the schema: `npm run db:migrate` (runs `supabase/migrations/0001_init.sql`
   with `psql`; you can also paste the file into the Supabase SQL editor).
4. Seed the nine synthetic demo referrals by POSTing to the reset endpoint,
   e.g. `curl -X POST http://localhost:3000/api/demo/reset` (requires the demo
   passcode cookie if `DEMO_PASSCODE` is set). This is safe to run repeatedly —
   it always leaves exactly the nine canonical records.

Access is server-only: database credentials are never sent to the browser,
and every query lives behind the API route or a server action.

`lib/db.ts` turns on TLS for the connection whenever `NODE_ENV=production`
(Supabase requires it, and `pg` doesn't always infer that from the
connection string alone), with certificate verification disabled via
`rejectUnauthorized: false`. This is Supabase's own documented guidance for
serverless clients: Vercel's Node runtime doesn't ship the CA needed to
verify Supabase's certificate chain, which otherwise surfaces as `self
signed certificate in certificate chain`. The tradeoff is real — it removes
protection against a man-in-the-middle presenting a different certificate —
so treat it as scoped to this specific, confirmed gap rather than a general
default. A stronger alternative, if this app ever needs it, is pinning
Supabase's actual CA certificate via the `ca` option instead of disabling
verification outright.

### AI extraction (Anthropic API)

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
   and set `ANTHROPIC_API_KEY` in `.env.local`. Set a low spend limit on the
   account during the demo phase — the API is metered.
2. `POST /api/referrals/:id/triage` runs extraction on that referral's raw
   text and returns the result. It only extracts and suggests — it does not
   assign priority, owner, or due time (that's written clinic rules, added
   in a later session) and it does not yet save anything to the database.
3. The model may only conclude `requested_service`,
   `urgency_label_from_source`, `referring_clinician`, or `suggested_route`
   when it can back that conclusion with a quote copied verbatim from the
   referral text (`lib/extraction/validate.ts` checks this against the
   actual raw text, not just the response's shape). If the response fails
   that check, or isn't valid against the schema at all
   (`lib/extraction/schema.ts`), it retries once; if the retry also fails,
   the endpoint returns `{ status: "needs_review", reason: "..." }` instead
   of a fabricated result.
4. The prompt lives in `config/triage-prompt.v1.md` — edit behavior there,
   not in code, and bump the filename (and `TRIAGE_PROMPT_VERSION` in
   `lib/extraction/prompt.ts`) on any real change so old triage runs stay
   attributable to the prompt version that actually produced them.

Tests (`npm run test`) mock the model entirely — `lib/extraction/index.ts`
takes an injectable `ModelCaller`, so the retry logic and evidence
validation are tested without any network call or API cost. Real calls to
Anthropic still require your own `ANTHROPIC_API_KEY` and are not exercised
by the test suite.

### Debugging a failed queue load in production

Next.js redacts Server Component error messages in production and shows
only a generic message plus an `error.digest` (our `/queue` error boundary
displays the digest). To see what actually failed, check the platform's
server-side runtime logs (e.g. Vercel: Deployments > your deployment >
Runtime Logs, or `vercel logs <deployment-url>`) — they carry the full,
unredacted error and stack trace.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run test` — Vitest unit tests (the reset script is tested against an
  in-memory Postgres, no live database needed)
- `npm run db:migrate` — apply `supabase/migrations/0001_init.sql` to `$DATABASE_URL`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
