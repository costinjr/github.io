# Vintage Vines

One-of-one plant shop website. Next.js (App Router) + TypeScript + Tailwind CSS v4, deployed to Vercel with Supabase for data/auth/storage in later phases.

Build spec: section-by-section product and build specification, implemented one numbered section at a time per its build sequence (`§17`).

## Status: Phase 2 — Data

Phase 1 — Foundation:

- Design tokens and typography (`src/app/globals.css`)
- Route shell for all required public/admin routes
- Site header and footer (`src/components`)
- Typed, editable business configuration (`src/config/business.ts`, `src/config/routes.ts`) — fields marked PENDING in the spec are `null`/empty and must not be invented
- Environment validation (`src/lib/env.ts`)

Phase 2 — Data:

- Schema migrations (`supabase/migrations/0001_init.sql`, `0002_storage.sql`): `inventory_items`, `inventory_images`, `claims`, `admin_users`, plus the two storage buckets (`inventory-originals` private, `inventory-public` public)
- `business_content` is intentionally not a table — section 11 explicitly allows a single typed config file for v1, which Phase 1 already built
- Row-level security: the public can only read `available` items and their images; everything else (drafts, claims, admin allowlist) requires an approved admin, checked via a Postgres function against the `admin_users` table
- A single CHECK constraint (`inventory_items_publish_requires_details`) enforces the spec's two-tier field requirements: a handful of columns are required from the moment a draft is created, the rest are only required once status moves to `available`/`checkout_hold`/`sold`
- Hand-written TypeScript types (`src/types/database.ts`) matching the schema — regenerate with `supabase gen types typescript` once a live project exists
- Typed query functions (`src/lib/inventory.ts`) and two Supabase client factories (`src/lib/supabase/server.ts` public/anon, `src/lib/supabase/admin.ts` service-role, server-only)
- `supabase/seed.sql`: local/dev-only sample inventory; never run against production, matching the spec's "production launches empty" rule

### Applying the schema

This repo doesn't include a `supabase/config.toml` (no local Supabase CLI project has been initialized yet). Once a real project exists, run the migrations in order against it (via the Supabase SQL editor, `psql`, or `supabase db push`), then optionally run `supabase/seed.sql` against a local/dev database only.

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
