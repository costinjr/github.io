# Northstar Triage Demo

Company Intake Triage Tool — a synthetic-data-only demo for a fictional
specialty clinic. Staff paste a messy inbound referral or use a short form;
the tool extracts the facts, checks completeness, and applies written triage
rules to assign priority, owner, and due time. See `CLAUDE.md` for the
project guardrails.

This is Session 1 of the build: the app shell, navigation, and a demo
passcode gate. The database and AI extraction are added in later sessions.

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

## Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm run lint` — ESLint

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
