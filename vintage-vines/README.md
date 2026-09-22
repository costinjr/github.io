# Vintage Vines

One-of-one plant shop website. Next.js (App Router) + TypeScript + Tailwind CSS v4, deployed to Vercel with Supabase for data/auth/storage in later phases.

Build spec: section-by-section product and build specification, implemented one numbered section at a time per its build sequence (`§17`).

## Status: Phase 1 — Foundation

- Design tokens and typography (`src/app/globals.css`)
- Route shell for all required public/admin routes
- Site header and footer (`src/components`)
- Typed, editable business configuration (`src/config/business.ts`, `src/config/routes.ts`) — fields marked PENDING in the spec are `null`/empty and must not be invented
- Environment validation (`src/lib/env.ts`)

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
