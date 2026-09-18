# Northstar Triage Demo

Company Intake Triage Tool — a synthetic-data-only demo for a fictional
specialty clinic. Staff paste a messy inbound referral or use a short form;
the tool extracts the facts, checks completeness, and applies written triage
rules to assign priority, owner, and due time. See `CLAUDE.md` for the
project guardrails.

This covers Sessions 1–2 of the build: the app shell, navigation, a demo
passcode gate, and the Supabase Postgres schema with a synthetic seed/reset.
AI extraction is added in a later session.

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
