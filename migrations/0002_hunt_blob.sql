-- Per-user hunt snapshot (favorites, notes, hidden, alerts, …). Scoped by user_id.
create table if not exists hunt_blob (
  user_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
