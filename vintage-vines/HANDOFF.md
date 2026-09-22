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

Nothing yet — this section fills in as I hit something in Phase 6–9
that needs your input rather than a guess. Check back here after each
phase.
