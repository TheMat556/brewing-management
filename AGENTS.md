<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guide

## Current state

- The `TODO.md` data/domain implementation is complete locally.
- A read-only brewing demo UI exists at `app/(app)/` using the shadcn `sidebar-08` block.
  It is backed by typed local fixtures in `lib/demo/`; **no Supabase domain queries or
  mutations are wired into the UI yet**.
- Hosted Supabase, production deployment, production Auth/SMTP, and backup rehearsal are
  deferred. Do not describe the app as deployed.
- Built from the official `with-supabase` starter. No Grove application code or structure was
  imported.
- Brewing contract: `docs/domain-conventions.md`. Setup/dependency decisions:
  `docs/setup-decisions.md`. Operational details: `README.md`.

## Commands

Use **Bun only** (`bun@1.3.14`); only `bun.lock` is committed. Do not create npm/yarn lockfiles.

```sh
bun install --frozen-lockfile
bun run check          # Biome lint + format + imports
bun run typecheck      # tsc --noEmit
bun run test           # unit tests only; excludes *.integration.test.ts
bun run test:integration
bun run build
```

Single unit test:

```sh
bunx vitest run lib/domain/validation.test.ts
```

Single integration test:

```sh
bunx vitest run --config vitest.integration.config.ts -t "test name"
```

- Run `bun run db:reset` after schema changes before integration tests.
- Run `bun run build` only after checks/tests. **Never run `next build` while `next dev` is
  running**; both write `.next` and the build corrupts dev asset hashes.
- CI runs in `.github/workflows/ci.yml`; the local commands above remain the pre-commit and
  debugging contract.

## Database

- Migrations are the source of truth: `supabase/migrations/` (18 ordered files, one per
  table plus enums/shared logic/hardening).
- All domain tables use the `TB_` prefix. German entity/field names and enum values are
  intentional; do not rename them.
- Add a **new timestamped migration** for every schema change. Never edit or rename an
  applied migration.
- `bun run db:reset` is destructive and local-only. Never use `--linked` or point resets at
  hosted Supabase.
- After schema changes, regenerate types, then format the generated file:

  ```sh
  bun run db:types
  bunx biome check --write lib/database.types.ts
  ```

  Do not hand-edit `lib/database.types.ts`.
- Check schema health with `bunx supabase db lint`.
- Business invariants live in SQL: constraints, triggers, RLS, lot locks, and transactional
  RPCs. Do not reimplement them only in TypeScript.
- Use the RPCs for multi-table/atomic operations (recipe creation/release, batch copying,
  inventory movements, substitution, actual-use reconciliation). Multiple PostgREST calls are
  not one transaction. Direct table grants exist for draft editing/manual corrections and do
  not guarantee workflow atomicity.
- RPCs are `security definer` with `search_path = ''` and an explicit
  `assert_berechtigt()` check. Preserve that pattern and function grants.
- Access is a **single-owner allowlist** (`TB_BERECHTIGTER_BENUTZER`). RLS denies anonymous
  and non-allowlisted users. Being authenticated is not authorization. First user claims
  ownership via `zugang_beanspruchen()`.
- `TB_IDEMPOTENZ` prevents duplicate retried movements. Preserve movement idempotency and
  append-only behavior.
- No ORM. Do not add Prisma/Drizzle/Kysely unless explicitly requested; use generated
  Supabase types, RPCs, and Zod.

## Integration tests

- Require local Supabase and Docker. Configure once:

  ```sh
  cp .env.test.example .env.test.local
  # Fill values from: bunx supabase status -o env
  bun run db:start
  ```

- Tests use local Postgres as a direct `pg` client plus local service-role Auth admin. They
  truncate domain tables and the access allowlist and delete their test users.
- The helper refuses non-local hosts and ports other than `54322`. Never point
  `.env.test.local` at a hosted project.
- Concurrency and constraint claims must be tested against local PostgreSQL, not mocks.
- Unit tests (`bun run test`) must stay runnable without Supabase.

## Demo UI

- The app shell lives in `app/(app)/layout.tsx`; auth pages stay outside it.
- Routes: `/dashboard`, `/lager` (+ `bewegungen`, `rohstoffe`, `chargen/[id]`),
  `/rezepte` (+ `[id]`), `/sude` (+ `[id]`), `/geraete` (+ `[id]`), and
  `/einstellungen` (+ `zugang`).
- UI data comes from `lib/demo/` typed fixtures and selectors. Do not add Supabase calls to
  demo pages without replacing the fixture layer deliberately.
- Boil additions use `zugabe_nach_min` relative to the step start. `BoilSchedule` converts this
  to T-minus labels relative to the boil end; do not add a separate T-minus column/field.
- Demo actions are intentionally disabled. Do not make release/delete/stock buttons appear
  functional until they are wired to the real RPCs.
- Use `next/link` and Next navigation helpers, never raw `<a href="/...">`; development runs
  under the `/absproxy/3000` base path.
- With `cacheComponents`, client `usePathname()` usage must sit inside `<Suspense>`. Dynamic
  demo detail routes use `export const instant = false` plus `generateStaticParams()`.
- Use the existing `cn()` helper from `@/lib/utils`; do not add the `cn` package.
- UI primitives from the latest shadcn registry use the unified `radix-ui` package. Some
  starter primitives still use individual `@radix-ui/react-*` packages; both coexist.

## Frontend and tooling

- Next.js 16 uses `proxy.ts`, not `middleware.ts`; keep the starter's `proxy.ts` and
  `lib/supabase/proxy.ts` session-refresh flow.
- `next.config.ts` requires both `cacheComponents` and `partialPrefetching`.
- Tailwind is **v4**. There is no `tailwind.config.ts`; theme tokens are in
  `app/globals.css` via `@theme`. Do not reintroduce Tailwind 3 config or
  `tailwindcss-animate`; animations use `tw-animate-css`.
- shadcn is available through the dev dependency: `bunx shadcn ...`.
- Secrets: `.env.local` and `.env.test.local` are ignored. Never put service-role keys,
  secret keys, JWT secrets, DB passwords, or connection strings in `NEXT_PUBLIC_*` or client
  code.
- code-server development uses the prefix-preserving route and a dev-only base path:
  `https://<host>/absproxy/3000` with `NEXT_PUBLIC_BASE_PATH=/absproxy/3000`.
- When the browser must reach local Supabase through code-server, set
  `NEXT_PUBLIC_SUPABASE_URL=https://<host>/proxy/54321` and keep server-side auth on
  `SUPABASE_INTERNAL_URL=http://127.0.0.1:54321`. Supabase needs the prefix-stripping
  `/proxy` route; the Next app needs `/absproxy`.
  `/proxy/3000` strips the prefix and cannot serve Next assets. Production builds ignore
  `NEXT_PUBLIC_BASE_PATH` and use `/`.
