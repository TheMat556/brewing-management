-- TB_IDEMPOTENZ
-- Part of the brewing foundation.

create table public.tb_idempotenz (
  id bigint generated always as identity primary key,
  schluessel text not null,
  operation text not null,
  lagerbewegung_id bigint references public.tb_lagerbewegung (id) on delete restrict,
  erstellt_am timestamptz not null default now(),
  constraint uq_tb_idempotenz_operation_schluessel unique (operation, schluessel),
  constraint chk_tb_idempotenz_schluessel_nonblank check (btrim(schluessel) <> ''),
  constraint chk_tb_idempotenz_operation_nonblank check (btrim(operation) <> '')
);
