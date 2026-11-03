# Setup Decisions and Baseline Record

Date: 2026-11-03

This document records the decisions made while preparing the application. The brewing
domain is intentionally out of scope here.

## Scaffold

- Source: official `with-supabase` example from the Next.js repository.
- Command:

  ```sh
  npx create-next-app@latest brewing-management -e with-supabase --use-npm --yes --disable-git
  ```
- Git was initialized manually after baseline verification so that the unmodified starter
  could be committed before dependency or formatting changes.
- Baseline commit: `baseline: official with-supabase starter`.
- Grove was consulted only for its `package.json` dependency sections. No Grove pages,
  components, authentication code, configuration, scripts, instrumentation, or folder
  structure were copied.

## Resolved starter versions

| Package                 | Resolved         |
| ----------------------- | ---------------- |
| `next`                  | 16.4.4           |
| `react` / `react-dom`   | 19.3.1           |
| `typescript`            | 5.9.3            |
| `tailwindcss`           | 3.4.19           |
| `tailwindcss-animate`   | 1.0.7            |
| `@supabase/ssr`         | 0.12.7           |
| `@supabase/supabase-js` | 2.118.0          |
| `eslint`                | 9.39.5 (removed) |
| `eslint-config-next`    | 15.3.1 (removed) |

## Baseline results

| Check                   | Result                |
| ----------------------- | --------------------- |
| `npm run build`         | **Passed**            |
| `npm run dev` + `GET /` | **Passed**, HTTP 200  |
| `npm run lint`          | **Failed**, 85 errors |

The baseline lint failure was caused by template drift: `eslint-config-next@15.3.1` was
pinned while Next 16.4.4 generated `.next/types` files that the stale config linted and
rejected. No application source logic was implicated. The planned Biome migration removed
this toolchain mismatch rather than carrying the obsolete ESLint configuration forward.

## Next.js configuration fix

The starter enabled `cacheComponents` but not `partialPrefetching`, which caused a Next 16
configuration warning. The bundled Next.js documentation states that new Cache Components
projects should set both. `partialPrefetching: true` was added to `next.config.ts`; the
warning is gone and build/dev still pass. This is a framework-version fix, not Grove-derived
configuration.

## Package manager decision

**Bun 1.3.14**, pinned via `packageManager`. Only `bun.lock` is committed; the generated
`package-lock.json` was removed after conversion. This is an explicit project decision,
not an assumption inherited from Grove. `bun install --frozen-lockfile` is the reproducible
install command.

## Dependency decision table

Reference manifest: `TheMat556/grove` at review time. Versions below are the ranges found
there; resolved versions are from this project's lockfile.

| Package                     | Grove version | Already in starter? | Decision             | Reason                                                                       |
| --------------------------- | ------------- | ------------------- | -------------------- | ---------------------------------------------------------------------------- |
| `next`                      | `latest`      | Yes                 | Keep                 | Resolved Next 16.4.4; no blind copy of Grove versions                        |
| `react` / `react-dom`       | `^19.0.0`     | Yes                 | Keep                 | Resolved 19.3.1                                                              |
| `@supabase/ssr`             | `latest`      | Yes                 | Keep                 | Starter authentication and cookie handling                                   |
| `@supabase/supabase-js`     | `latest`      | Yes                 | Keep                 | Starter Supabase client                                                      |
| `tailwindcss`               | `^4.1.0`      | Yes, 3.4.19         | Keep starter version | Avoid an unrequested Tailwind 4 migration                                    |
| `tailwind-merge`            | `^3.3.0`      | Yes                 | Keep                 | Used by starter UI helper                                                    |
| `clsx`                      | `^2.1.1`      | Yes                 | Keep                 | Used by starter UI helper                                                    |
| `class-variance-authority`  | `^0.7.1`      | Yes                 | Keep                 | Starter component variants                                                   |
| `lucide-react`              | `^0.511.0`    | Yes                 | Keep                 | Starter icons                                                                |
| `next-themes`               | `^0.4.6`      | Yes                 | Keep                 | Starter theme switching                                                      |
| Radix packages              | Multiple      | Yes                 | Keep                 | Starter UI primitives                                                        |
| `zod`                       | `^4.4.3`      | No                  | **Add**              | Present in Grove and useful for server-side validation; resolved 4.6.7       |
| `vitest`                    | `^4.1.10`     | No                  | **Add**              | Test runner; resolved 5.1.0                                                  |
| `pg`                        | Not present   | No                  | **Add**              | Direct local PostgreSQL acceptance/concurrency tests; resolved 8.23.1        |
| `@types/pg`                 | Not present   | No                  | **Add**              | TypeScript types for `pg`; resolved 8.23.1                                   |
| `@biomejs/biome`            | `^2.5.3`      | No                  | **Add**              | Explicit replacement for ESLint; config written from scratch, resolved 2.6.4 |
| `supabase`                  | Not present   | No                  | **Add**              | Required by setup contract for pinned CLI migrations; resolved 3.0.0         |
| `@testing-library/react`    | `^16.3.2`     | No                  | Skip for now         | No component tests in setup scope                                            |
| `@testing-library/jest-dom` | `^6.9.1`      | No                  | Skip for now         | No component tests in setup scope                                            |
| `jsdom`                     | `^29.1.1`     | No                  | Skip for now         | Node-environment tests only                                                  |
| `@vitejs/plugin-react`      | `^6.0.3`      | No                  | Skip for now         | No component tests in setup scope                                            |
| `@vitest/coverage-v8`       | `^4.1.10`     | No                  | Skip for now         | Coverage threshold not yet defined                                           |
| `cypress`                   | `^15.18.1`    | No                  | Skip                 | E2E scope not part of setup                                                  |
| `@sentry/nextjs`            | `10`          | No                  | Skip                 | Monitoring is optional; would require deliberate configuration               |
| `zustand`                   | `^5.0.14`     | No                  | Skip                 | No client-state requirement yet                                              |
| `@base-ui/react`            | `^1.6.0`      | No                  | Skip                 | Duplicates Radix primitives already in the starter                           |
| `shadcn` (runtime package)  | `^4.13.0`     | No                  | Skip                 | Use `npx shadcn` on demand; not a runtime dependency                         |
| `tw-animate-css`            | `^1.4.0`      | No                  | Skip                 | Starter already uses `tailwindcss-animate`                                   |
| `server-only`               | `^0.0.1`      | No                  | Skip                 | Not needed by the retained starter code                                      |
| `husky`                     | `^9.1.7`      | No                  | Skip                 | Commit tooling is optional                                                   |
| `lint-staged`               | `^17.0.8`     | No                  | Skip                 | Commit tooling is optional                                                   |
| `@tailwindcss/postcss`      | `^4.1.0`      | No                  | Skip                 | Tailwind 4 tooling is incompatible with the retained Tailwind 3 setup        |
| Starter ESLint packages     | Not present   | Yes                 | **Remove**           | Replaced by Biome as an explicit project decision                            |

No ORM or additional backend was introduced. Supabase/PostgREST plus SQL migrations remain
the persistence stack.

## Test tooling decision

Vitest only for the setup phase. No UI test library or E2E framework is installed until
there is application behavior to test. The smoke test validates the `cn` helper and proves
the runner and path-alias configuration work.

## Local Supabase decisions

- Supabase CLI is a development dependency, not a global install.
- Local configuration lives in `supabase/config.toml` and is committed.
- `bun run db:start` starts a reduced stack:
  `-x studio,postgres-meta,storage-api,imgproxy,realtime,edge-runtime,logflare,vector,supavisor`.
  This keeps the database, Auth, REST, Kong, and Mailpit and avoids unnecessary memory use.
- Local Auth:
  - Site URL: `http://localhost:3000`.
  - Additional redirect URLs include `localhost` and `127.0.0.1` variants for `/protected`
    and `/auth/update-password`.
  - Email confirmations are enabled locally.
  - Local email rate limit is 30/hour for testing. This is not a production setting.
- `.env.local` uses the local API URL and publishable key only. The local secret key and
  JWT secret are deliberately not placed in the application environment.
- The brewing foundation is committed as ordered migrations under
  `supabase/migrations/` (enums, one per table, then shared logic).
- `db reset` validates the tooling, Auth bootstrap, and all brewing migrations.
- Generated TypeScript database types are committed at `lib/database.types.ts` and wired
  into the browser, server, and proxy Supabase clients.

## Local verification evidence

Performed against the local Supabase stack:

| Check                                      | Result                                                         |
| ------------------------------------------ | -------------------------------------------------------------- |
| Signup via Auth API                        | Passed; confirmation required, no session issued               |
| Confirmation email delivery                | Passed; email observed through Mailpit                         |
| Confirmation link                          | Passed; HTTP 303 to the configured app URL                     |
| Password login after confirmation          | Passed; access and refresh tokens issued                       |
| Refresh-token grant                        | Passed; new access token issued                                |
| Logout                                     | Passed; HTTP 204, subsequent token request rejected (HTTP 403) |
| Password recovery email + link             | Passed; recovery redirect targeted `/auth/update-password`     |
| Password update + login with new password  | Passed                                                         |
| Authenticated `/protected` with SSR cookie | Passed; HTTP 200 with user claims rendered                     |
| Unauthenticated `/protected`               | Passed; HTTP 307 redirect to login                             |

The UI forms are retained from the starter. A final human browser pass against hosted Auth
and SMTP is still required before production use.

## Domain foundation implemented

- Ordered foundation migrations create the prefixed `TB_` tables (one migration per table),
  native enums, constraints, indexes, triggers, RLS policies, access allowlist, idempotency
  support, sequence, and RPCs. Shared logic lives in the final migration.
- Access policy: single owner via `TB_BERECHTIGTER_BENUTZER`; the first authenticated user
  claims ownership with `zugang_beanspruchen()`. All domain access is RLS default-deny.
- Movement writes are RPC-only for application users, append-only, row-locked per lot, and
  protected against negative stock. Idempotency keys prevent duplicate retried movements.
- Trigger hardening rejects direct insertion of released versions, direct batches from draft
  versions, and mismatched direct `ist_menge` changes.
- Released recipe versions and their children are immutable; recipe/batch step ownership
  uses composite foreign keys.
- Mixed ownership rules use triggers: ingredient snapshots, base-unit locking, lot
  ingredient locking, movement lot/ingredient matching, equipment snapshots, and derived
  batch-step durations.
- `lib/domain/validation.ts` provides Zod schemas for domain inputs. Generated database
  types are integrated into all Supabase clients.
- Local acceptance suite: 27 PostgreSQL integration tests pass, plus unit tests for the
  starter helper and domain validation.

Detailed table names, constraints, RPC signatures, and semantics are documented in
[`domain-conventions.md`](domain-conventions.md).

## Free-plan limits recorded

Verified on 2026-11-03:

- Supabase Free: 500 MB database, 2 active projects, paused after 1 week of inactivity,
  5 GB egress, 5 GB cached egress, 1 GB file storage, 50,000 MAU, no automatic backups.
- Vercel Hobby: free for personal/non-commercial use; 1M CDN requests/month, 100 GB fast
  data transfer/month, 1M function invocations/month, 4 hours Fluid active CPU/month,
  360 GB-hours provisioned memory/month, 1 hour runtime logs.

Re-verify both before deploying; pricing and limits change.

## Deferred work

The following remain outside the completed local foundation:

- Hosted Supabase project, production deployment, and production Auth verification.
- Backup rehearsal against real brewing history.
- Brewing-domain UI screens, forms, and navigation.
- Any automated ABV/IBU/EBC/efficiency/scaling calculations; no formulas are implemented.
- Individual equipment serialization, maintenance, reservations, or scheduling.
- Multi-user tenancy. The implemented policy is an explicit single-owner allowlist.
