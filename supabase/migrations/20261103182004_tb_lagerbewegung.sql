-- TB_LAGERBEWEGUNG
-- Part of the brewing foundation.

create table public.tb_lagerbewegung (
  id bigint generated always as identity primary key,
  lagercharge_id bigint not null references public.tb_lagercharge (id) on delete restrict,
  sudzutat_id bigint references public.tb_sudzutat (id) on delete restrict,
  zeitpunkt timestamptz not null default now(),
  typ public.lagerbewegung_typ not null,
  mengen_delta numeric(12, 4) not null,
  notizen text,
  constraint chk_tb_lagerbewegung_delta_nonzero check (mengen_delta <> 0),
  constraint chk_tb_lagerbewegung_typ_sign check (
    (typ = 'ZUGANG' and mengen_delta > 0)
    or (typ in ('VERBRAUCH', 'ENTSORGUNG') and mengen_delta < 0)
    or (typ = 'KORREKTUR')
  ),
  constraint chk_tb_lagerbewegung_linked_typ
    check (sudzutat_id is null or typ in ('VERBRAUCH', 'KORREKTUR', 'ENTSORGUNG'))
);

create index idx_tb_lagerbewegung_charge_zeitpunkt
  on public.tb_lagerbewegung (lagercharge_id, zeitpunkt, id);
create index idx_tb_lagerbewegung_sudzutat on public.tb_lagerbewegung (sudzutat_id);
