# Handoff

Things only you can do — an account, a key, or a decision I don't have.
Each entry says exactly what to click or paste. I'm not guessing at any
of these or building fake stand-ins for them; the code either doesn't
need them yet, or gracefully degrades until they're filled in.

Check items off as you do them (`[x]`) so we both know where things stand.

---

## 1. Deploy to Vercel

- [ ] Done

Vercel needs to know the Next.js app lives in `vintage-vines/`, not the
repo root (this repo also holds an unrelated static site and another
app).

1. Go to **vercel.com** → **Add New** → **Project**.
2. **Import** the `costinjr/github.io` repository (connect GitHub first
   if you haven't).
3. On the configuration screen:
   - **Root Directory** → click **Edit**, select `vintage-vines`.
   - **Framework Preset** should auto-detect as **Next.js** once the
     root directory is set. Leave build/output settings on their
     defaults.
   - **Branch**: deploy `claude/tender-volta-dd9oqa` for now (or set it
     as the Production branch, or merge to `main` first — your call).
4. Before clicking Deploy, add environment variables (see table below).
5. Click **Deploy**.

### Environment variables to add in that same screen (or Project Settings → Environment Variables after)

| Name | Value | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | your production URL, e.g. `https://vintage-vines.vercel.app` (or your custom domain once you have one) | Vercel will show you the assigned URL after first deploy — you can update this var and redeploy once you know it |
| `NEXT_PUBLIC_SUPABASE_URL` | your project URL | Supabase Dashboard → **Settings** → **API** → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the `anon` `public` key | same page, **Project API keys** |
| `SUPABASE_SERVICE_ROLE_KEY` | the `service_role` `secret` key | same page — **do not** put this in a `NEXT_PUBLIC_*` variable, it bypasses all database security |
| `ANTHROPIC_API_KEY` | *(optional)* | See section 3 below — leave unset and the plant matchmaker runs in deterministic-only mode, which is a fully working fallback, not a broken state |
| `CRON_SECRET` | *(optional but recommended)* any random string you generate | Protects the hold-expiry sweep endpoint — see the Phase 8 notes near the bottom of this file |

Set these for **Production**, **Preview**, and **Development**
environments (Vercel asks per-variable, or has an "all environments"
checkbox).

6. After the first deploy, come back and update `NEXT_PUBLIC_SITE_URL`
   to match the real deployed URL, then redeploy (Vercel → Deployments →
   ⋯ → Redeploy) so metadata/canonical links are correct.

### Sanity check once deployed

- Visit `/purchase` and `/inventory` — should show the empty-state copy
  ("Fresh pieces are taking root...") since the production database has
  no items yet.
- Visit `/admin/login`, sign in with `costin.jon@gmail.com` — you should
  land on the inventory dashboard, empty, with an "Add a piece" button.

---

## 2. Add a second admin: vintagevinesohio@gmail.com

- [ ] Done

Two steps, same as your own admin setup:

1. **Supabase Dashboard → Authentication → Users → Add user → Create new
   user.** Email: `vintagevinesohio@gmail.com`. Check **Auto Confirm
   User**. Create.
2. **SQL Editor → New query**, run:
   ```sql
   insert into admin_users (email) values ('vintagevinesohio@gmail.com');
   ```

---

## 3. Run the AI usage tables migration

- [ ] Done

Phase 7 (the plant matchmaker's AI wrapper) added a new migration for
rate-limiting and monthly spend-cap tracking. Same as Step 1 of the
original three: **SQL Editor → New query**, paste, run.

```sql
-- AI wrapper support tables (section 6: "Rate-limit each public AI
-- endpoint by IP and session ... Enforce a hard monthly AI API spend
-- cap"). Server-only: RLS is enabled with zero policies, which denies
-- every role except the service-role key (which bypasses RLS). Only
-- server code (src/lib/supabase/admin.ts) should ever touch these —
-- there is deliberately no public or admin_users policy here.

create table ai_requests (
  id uuid primary key default gen_random_uuid(),
  -- A hash of IP+session, never the raw value — section 6: "Do not
  -- store free-text input by default" extends to not storing anything
  -- that identifies the visitor either.
  client_key text not null,
  endpoint text not null check (endpoint in ('matchmaker', 'help_my_plant')),
  created_at timestamptz not null default now()
);

create index ai_requests_client_key_created_at_idx on ai_requests (client_key, created_at);

create table ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null check (endpoint in ('matchmaker', 'help_my_plant')),
  estimated_cost_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create index ai_usage_log_created_at_idx on ai_usage_log (created_at);

alter table ai_requests enable row level security;
alter table ai_usage_log enable row level security;
```

This is needed regardless of whether you set up an AI key — rate
limiting protects the deterministic-only matchmaker endpoint too.

---

## Decisions and accounts still needed for later phases

### Phase 6 (done) — one open design question, not a blocker

Section 6's scoring table gives "occasion and gift fit" a 10-point line,
but nothing in `inventory_items` captures how gift-appropriate a piece
is — there's no occasion-shaped column to score against. I didn't
invent a mapping (e.g. guessing that "closing gift" should favor a
particular size or vessel style). The matcher scores this dimension as
always 0 for now, documented in `src/lib/matching/score.ts`. The
`featured` flag (admin toggle, +5 points) is the closest existing lever
for "this piece reads well as a gift" today.

Not urgent — nothing is broken, the matcher just doesn't score this one
dimension. Worth a decision from you or Libby eventually: either pick a
concrete signal (e.g. a `gift_worthy` flag, or map specific vessel
styles/sizes to specific occasions) or leave it as-is.

### Phase 7 (done) — AI wrapper works, but runs deterministic-only without a key

Built: a provider-agnostic adapter interface, one concrete
implementation (Anthropic's API — structured tool-use output, validated
against the exact section-6 schema before it's ever shown to a
visitor), rate limiting and a monthly spend cap backed by the new
`ai_requests`/`ai_usage_log` tables (Step 3 above), and a deterministic
keyword-based fallback parser for when AI is unavailable, over budget,
or its output fails validation.

The plant matchmaker on the landing page is fully wired up and works
right now with zero AI configuration — it runs the deterministic
fallback parser → Phase 6's matcher → deterministic explanation
templates. I tested this exact path end to end (with temporary fixture
inventory, since this sandbox can't reach your live Supabase project)
and it correctly matched, excluded a toxic item under a pet-safety
request, and explained the result using only real facts.

To turn on live AI parsing and warmer AI-written explanations instead
of the deterministic fallback:

1. Get an API key at **console.anthropic.com**.
2. Add `ANTHROPIC_API_KEY` to Vercel's environment variables (Production/Preview/Development).

Optional tuning, both have working defaults:

- `ANTHROPIC_MODEL` — defaults to `claude-haiku-4-5-20251001`.
- `AI_MONTHLY_SPEND_CAP_CENTS` — defaults to `2000` ($20/month). Section
  6 requires *some* hard cap but never states the number — this is a
  starting point, not a business decision; change it to whatever you
  and Libby actually want to spend.

Nothing here blocks anything else — the matchmaker works today either way.

### Phase 8 (partially done) — the backend plumbing is real and tested; checkout itself needs two decisions from you

**Built and verified:** the atomic double-claim prevention (section 9:
"Prevent double claims with an atomic database operation") and hold
expiration. `src/lib/claims/create-hold.ts` does the actual hold via a
single conditional `UPDATE ... WHERE status = 'available'` — Postgres's
own concurrency guarantees mean that of two simultaneous claims on the
same item, only one can ever match that condition. I didn't just assert
this; I proved it by firing two real, truly concurrent transactions at
a local Postgres instance racing on the same row — one got the row
back, the other got zero rows, exactly once. `src/lib/claims/expire-holds.ts`
releases holds whose 15-minute window has passed, wired to run every 5
minutes via `src/app/api/cron/expire-holds/route.ts` and `vercel.json`.
Set a `CRON_SECRET` environment variable in Vercel (any random string)
and Vercel will automatically send it as a Bearer token, so the route
isn't callable by anyone who finds the URL. (Vercel's free Hobby plan
limits cron frequency — if you're on Hobby, either accept a slower
sweep or trigger the same URL from any external scheduler instead,
like a GitHub Actions cron or cron-job.org, since it's just a normal
authenticated HTTP endpoint.)

**Deliberately NOT wired to any button yet.** Section 18 is explicit:
*"RESOLVED: v1 takes online payment ... do not build or describe a
reservation-request checkout mode."* A hold with no payment step
immediately following it — which is all I could build without a
provider — would effectively *be* that rejected reservation mode if I
put it behind a live "Claim this exact piece" button. So that button
stays honestly disabled (built in Phase 4) until it can lead straight
into real payment.

**What's still needed, both from you:**

1. **A payment provider decision.** Section 9 requires a "hosted-payment
   provider adapter" but never names one. Stripe is the standard choice
   for a Next.js app like this, but I'm not choosing it for you —
   confirm Stripe (or name another) and I'll build the adapter and wire
   it to the hold mechanism above.
2. **A real account and API keys for whichever provider** — nothing can
   process an actual payment without them, however the adapter is built.
3. **One more provider-shaped gap I found while building this**: the
   fulfillment fee tiers in section 9 are distance-based ("free within
   Upper Arlington and up to 10 miles; $10 for 10 to 20 miles...").
   Computing that automatically from a customer's address needs a
   geocoding/distance API (e.g. Google Maps), which is yet another
   account/key this spec never names. Until you decide on one, the
   honest interim answer is a manual one: collect the delivery address
   and let Libby confirm the fee herself, rather than pretending to
   auto-calculate a distance with no way to actually measure it.
