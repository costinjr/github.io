# Vintage Vines

One-of-one plant shop website. Next.js (App Router) + TypeScript + Tailwind CSS v4, deployed to Vercel with Supabase for data/auth/storage in later phases.

Build spec: section-by-section product and build specification, implemented one numbered section at a time per its build sequence (`§17`).

## Status: Phase 7 — AI wrapper

Live Supabase project: connected as of this phase — see `HANDOFF.md` for deploy steps and admin access. Schema, storage, and admin_users are already applied there.

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

Phase 4 — Public inventory:

- `/purchase`: the commerce wall — filters (light, care level, size, vessel style, price; "pet friendly" only appears once `business.petSafety.dataProvided` is true, since it can never match anything before that) over the full available-item grid, in Libby's manual sort order
- `/inventory`: the same live catalog without filters, positioned as a browsing/lookbook view rather than the shopping wall — the spec names both `/purchase` and `/inventory` as separate required routes with overlapping descriptions; this is my resolution of that overlap, not a literal spec instruction, so it's worth confirming with Libby
- `/purchase/[slug]`: item detail — photo gallery, full care/vessel/placement details, packaging, fulfillment tiers, and returns policy pulled straight from `business.ts`, plus `Product` JSON-LD (section 14) with live pricing and photos
- Every card and the detail page carry the "this is the exact piece" language product principle 1 requires — never phrased as if the photo were representative stock
- "Claim this exact piece" on a card is a real link to the item's detail page (checkout doesn't exist until Phase 8); on the detail page itself, where the real claim button belongs, it's rendered disabled with an honest note and a mailto fallback to Libby, rather than faked or silently broken
- A stale or sold-out link renders a friendly "this piece has found its home" page instead of a bare 404
- All three pages are `force-dynamic` — inventory changes need to show up immediately, not whenever the next static build happens to run

**A real bug this phase's testing caught:** `getAvailableInventory`/`getInventoryItemBySlug` originally let a Supabase error propagate and crash the page with a 500. I only found this because I actually loaded the pages in this environment (no live Supabase project configured) instead of assuming the happy path — and it's not just a sandbox artifact: the exact same crash would hit production during any real Supabase outage. Fixed by having every public inventory query catch and log, then fall back to the same empty state a genuinely empty catalog shows (`src/lib/inventory.ts`) — matching the spec's own "empty can still feel alive" principle instead of a stack trace.

**Verified**: full `tsc`/ESLint/`next build`; the empty-state, populated-grid, and item-detail pages actually rendered and screenshotted (with temporary fixture data standing in for a live Supabase project, then reverted) at desktop and mobile widths, including edge cases like null optional fields; the filter checkboxes exercised end-to-end with Playwright (checking "Bright light" correctly narrowed 3 items to 1, clearing restored all 3).

Phase 5 — Core pages:

- Landing page (`/`): hero, plant-matchmaker teaser, "how it works," live "Available now" grid (reuses Phase 4's `getLandingInventory`/`ItemCard`, omitted entirely when empty rather than repeating the empty-state block), realtor/shop cards, "Grown with Purpose," founder note
- The matchmaker section is a real, honest stand-in for Phases 6/7 (deterministic matching + AI wrapper don't exist yet): visitors can type and submit, and get an inline reply that emails their own words straight to Libby — not a disabled control sitting at the top of the homepage
- `/about`, `/realtors`, `/shops` filled in with the spec's actual approved copy (founder story quote, realtor pricing/lead time/fulfillment, shop terms) — all sourced from `src/config/business.ts` and the new `src/config/site-copy.ts` (page-level marketing copy, kept separate from both business facts and components per section 11)
- Realtor and shop "start an order" / "ask about a display" actions are `mailto:` links with a prefilled subject and body — the spec never describes an online ordering flow for either B2B path (Phase 8's checkout is explicitly the *inventory claim* flow only), so a direct line to Libby is the complete, honest implementation, not a stand-in for something bigger
- `PurposeBlock` is shared between the landing page and About so the PENDING beneficiary org/donation amount only needs to be wired up in one place once Libby decides

**A real gap caught before it shipped, not after:** the landing page hero was originally written to reference `/hero-brass-tumbler-teapot.jpg` — the exact photo section 2 describes — but that file was never actually supplied to this build. Rather than ship a broken image reference, the hero renders a palette-only placeholder with a comment marking exactly where the real photo goes and how to wire it in (`next/image`, `fill`, `object-cover`). This is a genuine missing asset, not a PENDING decision — someone needs to supply the actual photo file.

Phase 6 — Deterministic matching (`src/lib/matching/`):

- `MatchPreferences` — section 6's preference-object table as a type, deliberately independent of how it gets populated (Phase 7's AI parser, a filter form, or a test fixture all produce the same shape)
- Hard filters split into two tiers, matching a real nuance in the spec: pet safety and an explicit budget are non-negotiable under any circumstance (`filters.ts`); a light mismatch is a softer hard filter that's allowed to fall back to a named "closest safe option" when it's the *only* thing blocking every candidate
- Scoring weights live in one config module (`config.ts`) — light 35, care+watering 25 (split evenly, each fading by ordinal distance so "asked for easy, got moderate" beats "asked for easy, got involved"), size 15, vessel style 10, occasion 10, featured 5, summing to exactly 100
- One documented, deliberate gap: "occasion and gift fit" has no inventory field to score against, so it always contributes 0 rather than a guessed mapping — see `HANDOFF.md`
- Confidence (strong/good/limited) is an achieved-vs-possible ratio computed only over dimensions the visitor actually specified, capped at "limited" when almost nothing was specified — never an invented percentage
- Deterministic explanation templates (`templates.ts`) reuse the exact spec copy for "no inventory," and build match explanations only from the item's own stored fields — these aren't just Phase 6's own copy, they're the literal fallback Phase 7 will use whenever the AI wrapper is unavailable or fails validation
- 37 unit tests (`npm run test`, via a new Vitest setup) proving the acceptance-criteria claims directly: a low-light request never returns a high-light-only item, pet safety is never relaxed even in a fallback, a budget is never exceeded, alternates never duplicate the selection, weights sum to 100

**A real bug the tests caught immediately:** the deterministic match explanation's headline could exceed the 70-character limit section 6's AI output contract sets — a test asserting that limit failed on the first run against a long display name. Fixed with a template that falls back to a shorter phrasing, then to a truncated one, before exceeding the limit. This matters beyond Phase 6: Phase 7 reuses this exact template as its AI-unavailable fallback, so the bug would otherwise have shipped there too.

Not wired into the landing page yet as of Phase 6 — the matchmaker teaser emailed Libby directly, since it needed Phase 7's free-text parser to turn a visitor's sentence into a `MatchPreferences` object. Phase 7 (below) wires it up for real.

Phase 7 — AI wrapper (`src/lib/ai/`):

- Provider-agnostic `AiProvider` interface (`provider.ts`) plus one concrete implementation, `AnthropicProvider` — structured tool-use output for both the free-text parser and the match explanation, each validated against a strict zod schema (`schemas.ts`) mirroring section 6's contracts before anything reaches a visitor
- A deterministic, regex/keyword-based fallback parser (`fallback-parser.ts`) implements section 6's "AI unavailable: run deterministic matching from any explicit criteria" literally — it only ever sets a field on a clear, explicit signal, staying "unknown" rather than guessing, and it's immune to prompt injection by construction (it's pattern matching, nothing it reads is ever executed)
- The plant matchmaker is now fully wired up and live on the landing page — with **zero AI configuration**, it runs deterministic parser → Phase 6's matcher → deterministic templates, and works completely on its own
- Rate limiting and a hard monthly spend cap (`rate-limit.ts`, `cost-cap.ts`) backed by two new tables (migration `0003_ai_usage.sql`) — rate limiting fails *open* on a storage outage (an abuse-prevention mechanism going down shouldn't take the whole feature with it), the spend cap fails *closed* (can't verify we're under budget → skip AI, not risk uncapped spend)
- `validate-blurb.ts` implements section 6's server-side checks literally: rejects an id outside the candidate set, a stated price that doesn't match the record, a care claim that contradicts `care_difficulty` (an "easy" claim against an `involved` plant is caught, not just discouraged in a prompt), and a silently-dropped required constraint note
- Explicit timeouts everywhere in this path, not just the AI call itself (`with-timeout.ts`) — the Anthropic SDK's own default is 10 minutes, far too long for a page waiting on a response, and an unbounded Supabase call is exactly as capable of hanging a request as an unbounded AI call is
- One real, non-blocking gap, recorded in `HANDOFF.md`: section 6 requires *some* hard monthly AI spend cap but never states the number — defaults to $20/month via `AI_MONTHLY_SPEND_CAP_CENTS`, trivially overridden, not a guess at a business decision

**Two real bugs found by actually running this against the live dev server, not just reading the code back:**
1. An unhandled Supabase error in the brand-new rate-limit check crashed the entire matchmaker Server Action with a 500 — reproduced by loading the matchmaker in this sandbox (Supabase is unreachable here), which is exactly what a real Supabase outage would do in production too. Fixed by making the rate limiter fail open and the cost cap fail closed, both bounded by an explicit timeout, matching Phase 4's established resilience pattern instead of introducing a new failure mode.
2. Confirmed via a full Playwright run with temporary fixture inventory: a message mentioning travel, forgetting to water, a pet, and a dim office correctly excluded a toxic candidate, matched a pet-safe one, scored it "strong" confidence, and explained the match using only that item's real stored facts.

Needs your input to go further: an `ANTHROPIC_API_KEY` for live AI parsing/explanations (optional — deterministic mode is a complete, working fallback, not a stand-in), and running the new `0003_ai_usage.sql` migration. Both are in `HANDOFF.md`.

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
- `npm run test` — unit tests (Vitest)
