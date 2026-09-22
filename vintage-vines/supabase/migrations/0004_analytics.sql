-- Privacy-minded, first-party analytics (section 15). No third-party
-- tracker, no free-text visitor input ever stored here — just named
-- events, optionally tagged with an inventory id and a small result
-- state. Server-only: RLS enabled with zero policies, same pattern as
-- ai_requests/ai_usage_log.

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'page_view',
    'matchmaker_started',
    'match_returned',
    'no_match',
    'item_viewed',
    'claim_started',
    'claim_completed',
    'realtor_inquiry',
    'shop_inquiry',
    'contact_click',
    'instagram_click'
  )),
  inventory_item_id uuid references inventory_items (id) on delete set null,
  path text,
  result_state text,
  created_at timestamptz not null default now()
);

create index analytics_events_event_type_created_at_idx on analytics_events (event_type, created_at);

alter table analytics_events enable row level security;
