# Vintage Vines

One-of-one plant shop website. Next.js (App Router) + TypeScript + Tailwind CSS v4, deployed to Vercel with Supabase for data/auth/storage in later phases.

Build spec: section-by-section product and build specification, implemented one numbered section at a time per its build sequence (`§17`).

## Status: Phase 3 — Admin

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

Phase 3 — Admin:

- Public/protected route split under `/admin`: `(public)/login` and `(public)/auth/callback` are reachable signed out; everything in `(protected)` requires `requireAdmin()`, enforced again in every Server Action, not just at the route
- Restricted auth: Supabase Auth magic link with `shouldCreateUser: false` (no public sign-up), gated a second time by the `admin_users` RLS policy from Phase 2 — a signed-in user with no `admin_users` row sees nothing. The confirmation message is identical whether or not the email is real, so the form can't be used to enumerate admin accounts
- `src/proxy.ts` does the optimistic redirect (signed out → `/admin/login`); the real authorization check is the DAL (`src/lib/auth.ts`) plus RLS, per Next's own guidance that proxy/middleware is never sufficient on its own
- Item form covers the full admin flow from section 10: JPEG upload with client-side preview/reorder/rotate/cover-select before upload (canvas-based rotation, not just a CSS transform), size/price, care fields, directional placement (built from structured fields in `directional-placement-builder.tsx`, editable afterward), draft vs. publish (mirrors the DB's two-tier requirement split), status, manual sort (drag-and-drop plus up/down buttons as an equal keyboard-accessible alternative, per section 13), bulk archive, duplicate
- Pet safety is hard-gated in the form to "unknown" until `business.petSafety.dataProvided` flips true — the admin can't accidentally mark something pet-safe ahead of Libby's data
- Image processing (`src/lib/image-processing.ts`): sharp strips EXIF/GPS by dropping it on output, auto-orients from the EXIF tag before stripping (so portrait phone photos don't end up sideways), and generates a WebP derivative; verified directly against a real JPEG with an EXIF orientation tag — this caught two real bugs (see below)
- Storage paths follow `inventory/{item_id}/{image_id}/...` as assumed by the Phase 2 storage RLS policies; uploads and DB writes both go through the signed-in admin's own session client, so RLS — not application code — is what's actually authorizing each write

**Two bugs the manual verification caught, not just written and assumed correct:**
1. Reading image dimensions from the sharp pipeline object before the final buffer is produced reports *pre-rotation* dimensions — for any portrait EXIF-oriented photo this silently swapped width/height. Fixed by reading metadata back from the finished buffer.
2. `item-form.tsx` (a client component) imported a constant from `image-processing.ts`, which also imports `sharp` — pulling the native image library into the browser bundle and breaking the build. Fixed by moving the shared constants into a dependency-free `upload-limits.ts`.

**Not verifiable without a real Supabase project** (no live project exists yet): the actual magic-link email round trip, live Storage uploads, and RLS behavior under real HTTP traffic (Phase 2's RLS logic was verified against real Postgres directly; Phase 3 wires it up through Supabase's client libraries, which this environment can't run end-to-end without Auth/PostgREST/Storage servers). What's covered instead: full `tsc`/ESLint/`next build`, the proxy's redirect behavior against a running dev server, the magic-link form's client-server round trip, and the image-processing pipeline against a real JPEG.

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
