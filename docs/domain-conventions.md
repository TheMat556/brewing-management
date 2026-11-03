# Domain Conventions for the Brewing Implementation

Status: preparation only. No brewing tables, migrations, RLS policies, RPC functions, or
generated database types exist yet. This document fixes conventions so the `TODO.md`
implementation does not have to make the same decisions twice.

The German entity names, field names, and enum values in `TODO.md` are authoritative. This
document does not add entities or change scope.

## Naming

- Keep German entity and field names exactly as specified.
- PostgreSQL folds unquoted identifiers to lowercase, so SQL uses `rohstoff`,
  `ziel_stammwuerze_plato`, etc. Application-facing TypeScript types may expose the same
  names; documentation and UI labels may be English.
- Enum values stay uppercase German, for example `MALZ`, `HOPFEN`, `ENTWURF`, `GEPLANT`,
  `ABGESCHLOSSEN`.
- Do not rename a domain field to an English synonym in the database or generated types.
- Application-only helpers may use English names, but they must not become domain columns.

## Primary and foreign keys

- Use `bigint generated always as identity` for all domain primary keys.
- Foreign keys use `bigint` with matching nullability.
- Prefer composite foreign keys for step ownership:
  - `REZEPTSCHRITT(id, rezeptversion_id)` unique, referenced by
    `REZEPTZUTAT(rezeptschritt_id, rezeptversion_id)`.
  - `SUDSCHRITT(id, sud_id)` unique, referenced by `SUDZUTAT(sudschritt_id, sud_id)`.
    This enforces that an assigned step belongs to the same parent without a row-level CHECK
    across tables.
- PostgreSQL sequences and identity columns can allocate gaps. Gaps are acceptable;
  application code must not assume contiguous IDs.

## BIGINT and decimal handling across the API

PostgREST serializes `bigint` and `numeric` values as JSON numbers, and `supabase-js`
exposes them as JavaScript numbers. Consequences:

- BIGINT IDs are safe while below `Number.MAX_SAFE_INTEGER` (2^53 - 1). Identity-generated
  IDs will remain far below that limit in this application. Do not use JavaScript arithmetic
  to construct or compare arbitrary PostgreSQL BIGINT values.
- Numeric values must be small and scaled enough to round-trip safely. The proposed types
  below stay far below the safe-integer range, but JavaScript still does not preserve the
  original decimal scale (for example, `1.2300` may become `1.23`).
- Never use JavaScript floating-point arithmetic for brewing or inventory calculations.
  Perform sums, comparisons, and locking in SQL, or return exact values as text from an RPC
  when exact decimal representation matters.
- API inputs are validated with Zod as well as database constraints. Database constraints
  remain the final authority.

## Proposed numeric precision and scale

Final precision must be confirmed in the first domain migration, but the implementation
should start from a documented, consistent proposal:

| Data                                                                | Proposed type   | Notes                                                        |
| ------------------------------------------------------------------- | --------------- | ------------------------------------------------------------ |
| Ingredient quantities in base units (g, ml, Stück)                  | `numeric(12,4)` | Preserves fractional grams and milliliters; 8 integer digits |
| Water volumes, output volumes, bottled volume, LOB volumes          | `numeric(12,4)` | Same scale for consistent handling                           |
| Durations and addition offsets in minutes                           | `numeric(12,4)` | Preserves fractional minutes                                 |
| Alpha-acid %, ABV %, Plato, IBU, EBC                                | `numeric(8,4)`  | Up to 9,999.9999; separate range checks apply                |
| Counts (`menge`, `zugewiesene_menge`, `versionsnummer`, `position`) | `integer`       | Not decimals                                                 |

Additional checks from `TODO.md` still apply: nonnegative quantities, 0–100 percentages,
nonzero movement deltas, and signed movement rules. Do not use `float`, `real`, or
`double precision` for stored brewing values.

## Temporal data

- Store instants as `timestamptz`; normalize to UTC for storage and convert for display.
  This applies to `erstellt_am`, `freigegeben_am`, `zeitpunkt`, `gestartet_am`, and
  `beendet_am`.
- Store `braudatum`, `lieferdatum`, and `mhd` as `date`.
- Proposed defaults, to be confirmed in the migration:
  - `REZEPT.erstellt_am` and `REZEPTVERSION.erstellt_am`: `now()`;
  - `SUD.erstellt_am`: `now()`;
  - `LAGERBEWEGUNG.zeitpunkt`: `now()` unless the caller supplies an explicit timestamp.
- Do not default actual brewing values or actual quantities. NULL means unrecorded; zero is
  a recorded value.

## Nullability and defaults

Follow `TODO.md` exactly:

- Required: IDs, required foreign keys, names, enum fields, booleans, positions, version
  numbers, creation timestamps, movement timestamps, `lieferdatum`, `sudnummer`, snapshot
  names/units, planned quantities.
- Optional foreign keys only: `REZEPTZUTAT.rezeptschritt_id`, `SUDZUTAT.sudschritt_id`,
  `LAGERBEWEGUNG.sudzutat_id`.
- Optional values include descriptions, instructions, notes, infos, supplier lot number,
  `mhd`, release timestamp, brewing date, process timestamps, actual values, actual
  quantities, bottled volume, optional target values, alpha-acid/EBC inputs, and optional
  LOB values.
- Defaults: `archiviert = false`, recipe version status `ENTWURF`, batch status `GEPLANT`,
  `lob_genutzt = false`.
- Do not use zero as an unknown sentinel. Unknown targets and actuals stay NULL.
- Validate names and `sudnummer` as nonblank after trimming. No global uniqueness for
  ingredient, recipe, or equipment names.

## Enum strategy

Proposed: native PostgreSQL enums for the fixed value sets in `TODO.md`, plus Zod
validation at application boundaries. Native enums give generated TypeScript union types
and database-level rejection of invalid values. Add new values through migrations.

If a value set is expected to change frequently, a `CHECK` constraint is an acceptable
alternative; the `TODO.md` contract allows either. Whichever is chosen, document it in the
migration and keep the values byte-for-byte identical to the contract.

Required value sets:

- `ROHSTOFF.kategorie`: `MALZ`, `HOPFEN`, `HEFE`, `GEWUERZ`, `SONSTIGES`
- `ROHSTOFF.basiseinheit`: `g`, `ml`, `Stueck`
- `REZEPTVERSION.status`: `ENTWURF`, `FREIGEGEBEN`
- `SUD.status`: `GEPLANT`, `IN_ARBEIT`, `ABGESCHLOSSEN`, `VERWORFEN`
- `LAGERBEWEGUNG.typ`: `ZUGANG`, `VERBRAUCH`, `KORREKTUR`, `ENTSORGUNG`
- `REZEPTSCHRITT.typ` / `SUDSCHRITT.typ`: `EINMAISCHEN`, `RAST`, `NACHGUSS`, `KOCHEN`,
  `GAERUNG`, `KALTHOPFUNG`, `REIFUNG`, `ABFUELLUNG`, `SONSTIGES`

## Row-level security and grants

- Enable RLS on every exposed domain table.
- Default deny. Do not create anonymous policies unless a later product decision
  explicitly requires public read access; the default is no anonymous domain access.
- `authenticated` does not automatically mean authorized. The access policy must be
  decided before domain policies are written: single owner or trusted group.
- Grant only the privileges needed by the chosen API paths. Review table grants as well as
  policies; a permissive grant can expose data even with RLS enabled if policies are
  incomplete.
- Prefer RPC-only writes for multi-table and stock operations. Revoke direct
  insert/update/delete privileges on those tables where the RPC is the intended write path.
- Elevated functions:
  - `security definer` only when required by the operation;
  - `set search_path = ''` and fully schema-qualify every referenced object;
  - `revoke all on function ... from public, anon`;
  - grant execute only to `authenticated` (or a narrower role);
  - re-check `auth.uid()` and the access policy inside the function.
- The service-role/secret key is for controlled server-side administration and tests only.
  It must never be shipped to the browser or placed in a `NEXT_PUBLIC_*` variable.
- Every new table requires an explicit grant/policy review; `auto_expose_new_tables` must
  not be treated as a security policy.

## Transactions and RPC boundaries

Multiple independent PostgREST calls are not one transaction. Use PostgreSQL functions via
RPC for operations that must be atomic:

- create a recipe and its first draft version;
- release a recipe version;
- create a batch with its steps and ingredients, including step-ID remapping;
- substitute a batch ingredient when a movement history check is required;
- record one or more inventory movements with lot locking and negative-stock rejection;
- any correction/reversal operation that spans multiple rows;
- deletion of unused draft content.

Each function must validate inputs, check row counts, raise a clear SQL exception on
failure, and commit all effects or none.

## Concurrency and idempotency

- **Lot stock writes:** lock affected `LAGERCHARGE` rows with `SELECT ... FOR UPDATE` before
  reading `SUM(LAGERBEWEGUNG.mengen_delta)` and inserting movements. Lock multiple lots in
  ascending ID order and use the same order everywhere. Keep the check and writes in one
  transaction. Reject any resulting negative stock.
- **Recipe version numbers:** allocate under a lock on the parent `REZEPT` row (or an
  equivalent database lock), then compute the next number. Do not use an unlocked
  `MAX + 1`. The unique constraint `(rezept_id, versionsnummer)` is the final guard.
- **Batch numbers:** allocate with a database sequence or a locked counter, not a read-then-
  write race. `UNIQUE(sudnummer)` is the final guard. The string format is still a product
  decision; do not invent one silently.
- **Idempotency:** there is no existing mechanism in the starter. Use a small internal
  request-key table with a unique constraint scoped to the operation and caller, inserted in
  the same transaction as the movement/operation. A retry with the same key returns the
  prior result or a duplicate indication instead of creating a second movement.
- **Tests:** concurrency claims must be demonstrated against local PostgreSQL with real
  parallel connections, not with mocks or SQLite.

## Immutability, snapshots, and cross-entity integrity

- Released recipe versions and their ingredient/step rows are immutable. A trigger must
  allow the release transition (`ENTWURF` → `FREIGEGEBEN`, setting `freigegeben_am`) and
  reject all later content changes. Changes require a new draft version.
- `freigegeben_am` is NULL for `ENTWURF` and non-NULL for `FREIGEGEBEN`. Enforce this with a
  CHECK constraint in addition to the release function.
- Copy recipe name/description into version snapshots at version creation; snapshots remain
  editable only while draft.
- Copy ingredient name and base unit into ingredient snapshots when the ingredient is added.
  Do not refresh historical snapshots when master data changes.
- Snapshot units must equal the ingredient's base unit at creation or explicit replacement.
  Prevent changing `ROHSTOFF.basiseinheit` once the ingredient is referenced by lots, recipe
  ingredients, or batch ingredients.
- Prevent changing `LAGERCHARGE.rohstoff_id` once the lot has movements.
- A movement linked to a batch ingredient must reference a lot of the same `ROHSTOFF`.
  Enforce this in the RPC write path and use a trigger as defense in depth against direct
  writes; document the chosen combination. Do not attempt this with an ordinary row CHECK.
- Prevent changing `SUD.rezeptversion_id` after batch creation in this implementation.
- Prevent deleting the final version of a retained recipe. A plain child foreign key cannot
  enforce the minimum-one relationship; use a controlled function/trigger.
- Equipment assignment validates `zugewiesene_menge <= GERAET.menge` and LOB eligibility at
  assignment/update time, then preserves snapshots. Historical assignments are not
  recomputed when master data changes.
- Do not add `rezeptzutat_id` to `SUDZUTAT`. Substitution history is represented by new
  batch ingredient rows and notes, not by rewriting old movements.

## Deletion and archiving

- Prefer archiving `ROHSTOFF`, `REZEPT`, and `GERAET` to deleting them.
- Use `ON DELETE RESTRICT` for referenced historical records. Never cascade-delete inventory
  movements, batches, or released recipe history.
- Permit deletion of unused draft content only through controlled operations.
- If a draft step with assigned ingredients is deleted, reject it or clear assignments
  explicitly first; never leave dangling references.
- A batch ingredient with any movement history cannot be deleted, even when net quantity is
  zero.
- Archiving a recipe does not permit modifying or deleting its released versions.

## Actual use versus stock movement

- `ist_menge` is the amount actually used in brewing, not automatically the sum of linked
  movements.
- Direct-use ingredients may have `ist_menge` with no inventory movement.
- When an ingredient is fully supplied from inventory, `ist_menge` must equal the net amount
  issued for use, accounting for linked consumption and its reversals/corrections.
- Booking convention: movements linked to a `SUDZUTAT` represent consumption or corrections
  of that consumption. Ordinary receipts, disposal, and unrelated corrections remain
  unlinked. Do not include them in actual-use reconciliation.
- If multiple lots with different alpha-acid or EBC values supply one ingredient, use
  separate `SUDZUTAT` rows or store an explicitly documented quantity-weighted input. Never
  silently choose one lot's value.
- Record movements only for actual consumption, not for planned quantities.

## Database-enforced versus application-enforced invariants

Proposed split; finalize while writing the migration and tests:

| Invariant                                                | Database                           | Application/RPC            |
| -------------------------------------------------------- | ---------------------------------- | -------------------------- |
| Enum values, numeric ranges, sign rules                  | CHECK/enum constraints             | Zod mirror                 |
| Uniqueness of version/step positions/equipment/sudnummer | UNIQUE constraints                 | Friendly error mapping     |
| Snapshot unit equals base unit                           | Trigger                            | Validate before save       |
| Step belongs to same version/batch                       | Composite FK                       | Validate step map          |
| Movement lot/ingredient match                            | Trigger + RPC write path           | RPC validation             |
| Released content immutable                               | Trigger                            | Disallow edit actions      |
| Base unit/lot ingredient identity locked                 | Trigger                            | Disable UI fields          |
| Minimum one recipe version                               | Trigger/controlled function        | Recipe delete guard        |
| Negative stock rejection                                 | RPC transaction + lot lock         | Error presentation         |
| Version/sudnummer allocation                             | Row lock/sequence + unique         | Retry messaging            |
| Actual-use reconciliation                                | RPC/query contract                 | Explain manual differences |
| Access policy                                            | RLS + RPC checks                   | Server-side auth checks    |
| Equipment availability at assignment                     | RPC check against current quantity | UI limits, no reservation  |

## Brewing-value semantics still to decide

Do not implement formulas until these product decisions are explicitly made:

- Whether `ist_abv_prozent`, `ist_ibu`, and `ist_ebc` are measured results or calculations
  from actual inputs; never present calculated values as laboratory measurements.
- The reference point for `ausschlagmenge` (for example, kettle versus fermenter) and
  consistent application to recipe and batch fields.
- Batch status behavior. No mandatory transition graph or automatic inventory effects are
  implied; document the chosen behavior when implementing status changes.
- `ist_dauer_min`: treat as elapsed duration. If both start and end timestamps exist, derive
  it from the timestamps; a manual duration is allowed only when timestamps are incomplete.
- LOB semantics. The fields exist; do not invent a meaning or formula.

## Open decisions before the first domain migration

1. Access policy: single owner or trusted group.
2. Confirm native enums versus CHECK constraints.
3. Confirm the proposed numeric precision/scale.
4. Confirm the `sudnummer` format and allocation mechanism.
5. Confirm the idempotency key table name/shape.
6. Confirm where calculated versus measured brewing values are allowed.
7. Confirm the `ausschlagmenge` reference point.
8. Confirm backup/restore rehearsal before storing real brewing history.
