-- Brewing enums
-- Part of the brewing foundation.

-- ---------------------------------------------------------------------------

create type public.rohstoff_kategorie as enum (
  'MALZ',
  'HOPFEN',
  'HEFE',
  'GEWUERZ',
  'SONSTIGES'
);

create type public.basiseinheit as enum ('g', 'ml', 'Stueck');

create type public.rezeptversion_status as enum ('ENTWURF', 'FREIGEGEBEN');

create type public.sud_status as enum ('GEPLANT', 'IN_ARBEIT', 'ABGESCHLOSSEN', 'VERWORFEN');

create type public.lagerbewegung_typ as enum ('ZUGANG', 'VERBRAUCH', 'KORREKTUR', 'ENTSORGUNG');

create type public.prozessschritt_typ as enum (
  'EINMAISCHEN',
  'RAST',
  'NACHGUSS',
  'KOCHEN',
  'GAERUNG',
  'KALTHOPFUNG',
  'REIFUNG',
  'ABFUELLUNG',
  'SONSTIGES'
);
