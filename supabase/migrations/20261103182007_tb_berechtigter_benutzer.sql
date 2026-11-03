-- TB_BERECHTIGTER_BENUTZER
-- Part of the brewing foundation.

create table public.tb_berechtigter_benutzer (
  benutzer_id uuid primary key references auth.users (id) on delete cascade,
  erstellt_am timestamptz not null default now()
);
