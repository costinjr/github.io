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
