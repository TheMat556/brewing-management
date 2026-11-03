-- Batch-linked movements represent consumption or corrections of that consumption.
-- Ordinary receipts and disposal remain unlinked, so ENT SORGUNG cannot reference a SUDZUTAT.

alter table public.tb_lagerbewegung
  drop constraint chk_tb_lagerbewegung_linked_typ;

alter table public.tb_lagerbewegung
  add constraint chk_tb_lagerbewegung_linked_typ
  check (sudzutat_id is null or typ in ('VERBRAUCH', 'KORREKTUR'));
