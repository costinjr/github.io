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

Set all four for **Production**, **Preview**, and **Development**
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

### Phase 7 (AI wrapper) — needs an API key

The free-text parser and AI-generated match explanation need a real AI
provider. I'll build the adapter, validation, rate limiting, and cost
cap against a generic interface, with one concrete implementation
(Anthropic's API, since that's the natural default and Claude Code
itself runs on it) — but nothing will actually call out to it without
an API key. If you want live AI parsing/blurbs rather than the
deterministic-only fallback (which is itself a required, working spec
behavior, not a broken state), get an API key from console.anthropic.com
and add it as `ANTHROPIC_API_KEY` (exact name to be confirmed once I
write that code) in Vercel's environment variables.

### Phase 8 (online claim and payment) — needs a decision + an account

Section 9 requires a "hosted-payment provider adapter" but never names
one. This is your call, not mine to guess: Stripe is the overwhelmingly
standard choice for a Next.js app like this, but I won't build against
it without you confirming that's what you want, and either way it
needs a real account and API keys before anything can actually process
a payment. I'll note the specifics here once I get to this phase.
