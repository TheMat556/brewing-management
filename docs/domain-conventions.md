# Domain Conventions and Implementation Notes

The brewing foundation is implemented through ordered migrations in
`supabase/migrations/`: enums, one migration per table, then shared functions, triggers,
RLS, and grants. German entity/field names and enum values follow `TODO.md`; every domain
table carries the `TB_` prefix requested for this project. PostgreSQL folds unquoted identifiers to lowercase, so SQL uses `tb_rohstoff`,
`tb_sud`, and so on.

## Types and identifiers

- All domain primary keys use `bigint generated always as identity`; foreign keys match.
- Quantities, volumes, durations, and addition offsets use `numeric(12,4)`.
- Percentages and brewing values use `numeric(8,4)`; alpha-acid and ABV are additionally
  constrained to 0–100.
- Instants use `timestamptz`; `braudatum`, `lieferdatum`, and `mhd` use `date`.
- No binary floating-point type is used for stored brewing values.
- BIGINT and numeric values cross PostgREST as JavaScript numbers. They remain below
  `Number.MAX_SAFE_INTEGER` in this application. Exact arithmetic is done in SQL; do not
  use JavaScript floating point for inventory or brewing calculations.
- Unknown values stay NULL. Zero is a recorded value and is never used as an unknown
  sentinel.

## Nullability and defaults

- Required columns follow `TODO.md`: IDs, required foreign keys, names, enums, booleans,
  positions, version numbers, creation/movement timestamps, `lieferdatum`, `sudnummer`,
  snapshot names/units, planned amounts.
- Optional foreign keys are only `tb_rezeptzutat.rezeptschritt_id`,
  `tb_sudzutat.sudschritt_id`, and `tb_lagerbewegung.sudzutat_id`.
- Descriptions, instructions, notes/infos, supplier lot, `mhd`, release timestamps,
  process timestamps, actual values, actual amounts, bottled volume, alpha/EBC inputs, and
  optional LOB values are nullable.
- `archiviert` defaults to false, recipe version status to `ENTWURF`, batch status to
  `GEPLANT`, and `lob_genutzt` to false.
- Required names and `sudnummer` are checked as nonblank after trimming.

## Enumerations

Native PostgreSQL enums enforce the contract values; Zod mirrors them for application
validation. Values are byte-for-byte aligned with `TODO.md`:

- `rohstoff_kategorie`: `MALZ`, `HOPFEN`, `HEFE`, `GEWUERZ`, `SONSTIGES`
- `basiseinheit`: `g`, `ml`, `Stueck`
- `rezeptversion_status`: `ENTWURF`, `FREIGEGEBEN`
- `sud_status`: `GEPLANT`, `IN_ARBEIT`, `ABGESCHLOSSEN`, `VERWORFEN`
- `lagerbewegung_typ`: `ZUGANG`, `VERBRAUCH`, `KORREKTUR`, `ENTSORGUNG`
- `prozessschritt_typ`: `EINMAISCHEN`, `RAST`, `NACHGUSS`, `KOCHEN`, `GAERUNG`,
  `KALTHOPFUNG`, `REIFUNG`, `ABFUELLUNG`, `SONSTIGES`

## Access policy

Domain access is **single-owner via allowlist**:

- `TB_BERECHTIGTER_BENUTZER` contains authorized auth user IDs.
- RLS is enabled on every domain table; all policies require
  `public.ist_berechtigt()`.
- The first authenticated user claims ownership with `zugang_beanspruchen()`. The function
  takes an exclusive lock and refuses a second claim.
- Anonymous access is denied by explicit revokes and the absence of anonymous policies.
- Table grants are explicit. Movement rows are read-only to authenticated users; writes go
  through the transactional RPC.
- The service/secret key is server-side administration and test tooling only; it never goes
  to the browser or a `NEXT_PUBLIC_*` variable.

## Transactions and RPCs

Multiple PostgREST calls are not atomic. The implemented RPC boundaries are:

- `rezept_erstellen` — recipe plus first draft version in one transaction.
- `rezeptversion_erstellen` — locks the parent recipe row and allocates the next version.
- `rezeptversion_freigeben` — status/release timestamp in one transaction.
- `rezeptversion_loeschen` — draft-only, final-version guard.
- `sud_aus_rezept_erstellen` — batch, copied steps, copied ingredients, and step-ID remap in
  one transaction.
- `lagerbewegung_erfassen` — idempotent movement write with lot locking and stock check.
- `sudzutat_ersetzen` — replacement only before movements exist; unit-change guard.
- `sudzutat_ist_menge_setzen` — actual-use recording with optional inventory reconciliation.
- `sudzutat_verbrauch_netto` — net issued quantity from linked movements.
- `naechste_sudnummer` — sequence-backed batch number allocation (`SUD-000001` format).

All RPCs use `security definer`, `set search_path = ''`, schema-qualified objects, and an
explicit `assert_berechtigt()` check. Execute privileges are revoked from public/anon and
granted only to authenticated. Trigger functions are internal and have no application
execute grant.

### Application boundary

The allowlisted owner has direct CRUD grants on most draft-editable tables, so the database
also supports manual correction and draft editing. The RPCs are the supported workflow for
operations that must be atomic: recipe creation/release, batch copying, inventory movements,
substitution, and actual-use reconciliation. Direct multi-call writes can bypass workflow
completeness (for example, creating a batch without copying all recipe rows); use the RPCs
for normal application behavior. Database triggers still enforce release, snapshot,
ownership, sign, and historical-integrity rules regardless of the write path.

## Concurrency and idempotency

- Movement triggers lock the affected `tb_lagercharge` row with `FOR UPDATE`, then sum
  movements and reject negative stock. Concurrent withdrawals serialize on that row. The
  current RPC affects one lot per transaction; any future multi-lot operation must lock lots
  in ascending ID order.
- Recipe version allocation locks the parent `tb_rezept` row; `UNIQUE(rezept_id,
  versionsnummer)` is the final guard.
- New versions must start as `ENTWURF`; a batch must reference a released version. Both are
  enforced by triggers as well as the RPCs.
- Batch numbers use the `tb_sud_nummer_seq` sequence; `UNIQUE(sudnummer)` is the final guard.
- `TB_IDEMPOTENZ` stores `(operation, idempotenzschluessel)` and the resulting movement ID.
  Retries return the original movement instead of inserting a duplicate.
- Direct changes to `ist_menge` are rejected when they do not equal the net linked movement
  quantity; actual-use recording without movements remains allowed for direct-use
  ingredients.
- Integration tests demonstrate concurrent stock, version allocation, and batch-number
  allocation against real local PostgreSQL.

## Immutability and snapshots

- Released recipe versions and their ingredient/step rows are immutable. The trigger allows
  only the release transition and rejects later updates, inserts, deletes, or status
  rollback.
- `freigegeben_am` is NULL for drafts and non-NULL for released versions; release must be
  after creation.
- Recipe name/description snapshots are copied at version creation.
- Ingredient snapshots are copied on insert and on explicit replacement. Master-data renames
  do not refresh historical snapshots.
- Base units are locked once referenced by a lot, recipe ingredient, or batch ingredient.
- A lot's `rohstoff_id` is locked once it has movements.
- `tb_sud.rezeptversion_id` is immutable after batch creation.
- Step ownership uses composite foreign keys:
  - `(rezeptschritt_id, rezeptversion_id) → tb_rezeptschritt(id, rezeptversion_id)`
  - `(sudschritt_id, sud_id) → tb_sudschritt(id, sud_id)`
- A movement linked to a batch ingredient must use a lot of the same raw ingredient. The
  trigger enforces this on every movement insert.
- Batch step duration is derived from complete start/end timestamps; manual values remain
  possible when timestamps are incomplete.

## Ingredient substitution

- Replacement is allowed only before the batch ingredient has any movement.
- `sudzutat_ersetzen` updates ingredient snapshots and explicitly sets or clears alpha/EBC
  inputs.
- A base-unit change requires a newly entered quantity; the same number is never silently
  reinterpreted.
- Direct `rohstoff_id` replacement clears alpha/EBC inputs; the RPC reapplies explicitly
  supplied values.
- Once movements exist, retain the original row, reverse errors with new movements, and add
  a new `tb_sudzutat` row for the replacement.
- Multiple rows can represent partial replacement or splitting a recipe ingredient.
- No `rezeptzutat_id` and no mandatory substitution table were added.

## Inventory booking

- Lot stock is `SUM(mengen_delta)`, zero when no movements exist.
- Initial stock is a `ZUGANG` movement, not a mutable balance field.
- Movements are append-only. Corrections are new `KORREKTUR` movements with notes.
- `ZUGANG > 0`; `VERBRAUCH`/`ENTSORGUNG < 0`; `KORREKTUR` is either sign but not zero.
- Linked movements are limited to `VERBRAUCH` and `KORREKTUR`; ordinary receipts and
  disposal remain unlinked.
- Actual use (`ist_menge`) is recorded independently of planned quantities. Direct-use
  ingredients may have `ist_menge` without movements. When inventory-supplied, the
  reconciliation RPC and trigger require it to equal the net issued amount.
- Multiple lots with different alpha/EBC values must use separate batch ingredient rows or
  an explicitly documented weighted value; no lot value is silently chosen.
- Archived ingredients remain visible in history. There is no selection UI yet; future
  pickers must filter `archiviert = false` for new selections by default.

## Equipment

- `TB_GERAET` represents a group of equivalent items, not serialized assets.
- `TB_SUDGERAET` stores batch-specific quantity, LOB usage, and snapshots.
- Assignment copies name and per-item LOB volume; later master-data changes do not refresh
  snapshots.
- Assigned quantity must not exceed the current group quantity.
- LOB use requires current LOB capability and a known snapshot volume.
- No time-based reservations, availability sums, individual assets, maintenance, or
  scheduling were added.

## Historical integrity and deletion

- Recipes, raw ingredients, and equipment are archived rather than deleted.
- Referenced records use restrictive foreign keys; no cascade deletes for movements,
  batches, or released recipe history.
- Draft-only deletion is exposed through controlled functions/guards.
- A draft step with assigned ingredients cannot be deleted until assignments are cleared.
- A batch ingredient with movements cannot be deleted or have its ingredient identity
  changed.
- The final recipe version cannot be deleted.

## Brewing-value semantics decided for this implementation

- `ist_abv_prozent`, `ist_ibu`, and `ist_ebc` record operator-entered actual values. No
  automatic formulas calculate or overwrite them. Calculated values must not be presented as
  laboratory measurements.
- `ausschlagmenge` refers to the volume of cooled wort transferred to the fermenter. Target
  and actual values use the same reference point.
- `ist_dauer_min` is elapsed duration. When both start and end timestamps exist, the trigger
  derives it; manual entry is allowed only when timestamps are incomplete.
- Batch statuses are informational. No mandatory transition graph and no automatic inventory
  effects are implemented.
- LOB remains an existing domain term; no formula or additional meaning is invented.
- No ABV, IBU, EBC, efficiency, or recipe-scaling formulas are implemented.

## Database-enforced versus application-enforced

| Invariant                                   | Enforcement                          |
| ------------------------------------------- | ------------------------------------ |
| Enum values, ranges, signs, nonzero deltas  | CHECK constraints and native enums   |
| Version/step/equipment/sudnummer uniqueness | UNIQUE constraints                   |
| Step ownership                              | Composite foreign keys               |
| Ingredient snapshot units/names             | Triggers                             |
| Base-unit and lot-ingredient locking        | Triggers                             |
| Movement lot/ingredient match               | Trigger plus RPC write path          |
| Released-version immutability               | Triggers                             |
| Final-version protection                    | Trigger plus RPC                     |
| Negative stock rejection                    | Row lock + trigger + RPC transaction |
| Version/batch number allocation             | Parent row lock / sequence + UNIQUE  |
| Draft-only new versions and released source | Insert/update triggers               |
| Idempotent retries                          | `TB_IDEMPOTENZ` unique key           |
| Actual-use reconciliation                   | Trigger + RPC contract               |
| Access policy                               | RLS, grants, and RPC checks          |
| Equipment assignment validation             | Trigger plus RPC/CRUD path           |

## Verification

- `bun run db:reset` applies the migration to a clean local database.
- `bunx supabase db lint --local` reports no schema errors.
- `bun run test:integration` runs 27 acceptance tests against local PostgreSQL.
- `bun run test` runs unit tests, including Zod validation.
- The generated `lib/database.types.ts` is wired into browser/server/proxy clients.

## Remaining product decisions

- Brewing-domain UI screens and workflows.
- Hosted deployment, production Auth/SMTP verification, and backup rehearsal.
- Any future automated brewing calculations require a separately specified algorithm and
  input contract.
