# Brewing Management App

A Next.js + Supabase application scaffolded from the official
[`with-supabase`](https://github.com/vercel/next.js/tree/canary/examples/with-supabase)
starter, with the brewing data foundation from `TODO.md` implemented as ordered migrations.

## Status

- Official `with-supabase` starter baseline committed before modifications.
- Default cookie-based Supabase authentication retained and verified locally.
- Local Supabase tooling, migrations workflow, and Mailpit email testing configured.
- Bun, Biome, Zod, and Vitest adopted as explicit project decisions.
- Brewing schema, constraints, triggers, RLS, transactional RPCs, generated database types,
  and application validation implemented.
- Domain access uses a single-owner allowlist; authenticated users are not authorized until
  listed.
- The hosted Supabase project, production environment variables, and production Auth
  verification are **deferred by the project owner** as of 2026-11-03. Local Supabase is the
  current development target.

See [`docs/setup-decisions.md`](docs/setup-decisions.md) for the dependency review,
baseline results, and verification evidence.
See [`docs/domain-conventions.md`](docs/domain-conventions.md) for the implemented database
conventions, access policy, RPC boundaries, and constraints.

## Stack

| Component               | Version |
| ----------------------- | ------- |
| Next.js                 | 16.4.4  |
| React / React DOM       | 19.3.1  |
| TypeScript              | 5.9.3   |
| Tailwind CSS            | 4.3.4   |
| tw-animate-css          | 1.4.0   |
| `@supabase/ssr`         | 0.12.7  |
| `@supabase/supabase-js` | 2.118.0 |
| Supabase CLI            | 3.0.0   |
| Zod                     | 4.6.7   |
| Zustand                 | 5.0.16  |
| shadcn CLI (dev)        | 4.23.0  |
| Vitest                  | 5.1.0   |
| `pg` (dev)              | 8.23.1  |
| Biome                   | 2.6.4   |
| Bun                     | 1.3.14  |

## Prerequisites

- **Bun 1.3.14** (pinned through `packageManager`; only `bun.lock` is committed).
- **Docker Engine** for the local Supabase stack. The current development machine uses
  Docker 26.1.5.
- No global Supabase CLI is required; it is a development dependency.

## Local setup

```sh
bun install --frozen-lockfile
bun run db:start
bunx supabase status
```

`bun run db:start` starts a reduced local stack: database, Auth, REST, Kong, and Mailpit.
Studio, storage, realtime, edge runtime, analytics, and the pooler are excluded to keep
resource use reasonable. Run `bunx supabase start` if you need all services.

Then configure the public environment values:

```sh
cp .env.example .env.local
```

Populate `.env.local` from the `supabase status` output:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable key>
```

Use `PUBLISHABLE_KEY` (or the legacy `ANON_KEY`). **Never** put `SECRET_KEY`,
`SERVICE_ROLE_KEY`, `JWT_SECRET`, database passwords, or connection strings into
`NEXT_PUBLIC_*` variables or browser code.

Start the app:

```sh
bun run dev
```

- App: <http://localhost:3000>
- Local email catcher: <http://127.0.0.1:54324>
- Local API: <http://127.0.0.1:54321>

Local Auth confirmation is enabled, and the local email rate limit is raised to 30/hour for
testing. Hosted deployments must use the hosted project's Auth settings and SMTP
configuration; local settings must not be treated as production settings.

### VS Code / code-server proxy

code-server's `/proxy/3000/` route strips the path prefix. Next.js emits absolute
`/_next/...` asset paths, so CSS and JavaScript fail unless a base path is configured.

Use code-server's **`/absproxy/3000/`** route instead:

```dotenv
# .env.local
NEXT_PUBLIC_BASE_PATH=/absproxy/3000
```

Then open `https://<your-code-server-host>/absproxy/3000/`. The base path is applied only
during development; production builds ignore `NEXT_PUBLIC_BASE_PATH`. For normal localhost
development, leave it blank and use `http://localhost:3000/`.

Do not run `next build` while `next dev` is running. Both write to `.next`, and the build
invalidates the dev server's asset hashes, producing 404s until the dev server is restarted
with a clean `.next` directory.

## Scripts

| Script                     | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `bun run dev`              | Next.js development server                                |
| `bun run build`            | Production build                                          |
| `bun run start`            | Serve the production build                                |
| `bun run lint`             | Biome lint                                                |
| `bun run format`           | Biome format with writes                                  |
| `bun run check`            | Biome lint, format, and import organization check         |
| `bun run typecheck`        | `tsc --noEmit`                                            |
| `bun run test`             | Vitest unit tests                                         |
| `bun run test:watch`       | Vitest watch mode                                         |
| `bun run test:integration` | Local PostgreSQL acceptance tests                         |
| `bun run db:start`         | Start the reduced local Supabase stack                    |
| `bun run db:stop`          | Stop local Supabase and back up its data volume           |
| `bun run db:reset`         | **Destructive to local data:** rebuild the local database |
| `bun run db:status`        | Show local connection values                              |
| `bun run db:types`         | Generate `lib/database.types.ts` from the local schema    |

## Database workflow

- Migrations are the schema source of truth. Add one only for a real schema change:

  ```sh
  bunx supabase migration new <name>
  bunx supabase db reset
  ```
- `supabase db reset` is for the **local** database only.
- Never run `supabase db reset --linked` or any destructive reset against a hosted project.
- `supabase stop --no-backup` permanently deletes local data volumes.
- The foundation is split into ordered migrations under `supabase/migrations/`: enums first,
  one migration per `TB_` table, then shared functions/triggers/RLS/grants.
- `bun run db:reset` rebuilds the local database and applies the foundation migration. This
  is the required check before merging schema changes.
- Generate database types after a schema change:

  ```sh
  bun run db:types
  ```

  Do not hand-edit generated types. They are not runtime validation.
- Integration and concurrency tests must use the local PostgreSQL instance. Do not use
  SQLite or mocks for database constraint tests.
- Integration tests refuse to run unless the API and database hosts are local and the
  database port is `54322`.

  ```sh
  cp .env.test.example .env.test.local
  # Fill values from: bunx supabase status -o env
  bun run test:integration
  ```

## Authentication

The starter's browser/server Supabase clients, session refresh, and `proxy.ts` convention
are retained. Protected pages and future protected actions must verify identity and
authorization server-side; navigation-level redirects alone are not authorization.

Verified locally through the Auth API and HTTP application routes:

- signup and confirmation email delivery,
- email confirmation and redirect,
- password login,
- refresh-token grant,
- logout invalidation,
- password recovery and password update,
- authenticated `/protected` access, and unauthenticated redirect to login.

### Access policy

The brewing domain uses a **single-owner allowlist**. RLS denies all domain access unless
`auth.uid()` appears in `TB_BERECHTIGTER_BENUTZER`; being authenticated is not sufficient.

The first authenticated user claims ownership once:

```ts
await supabase.rpc("zugang_beanspruchen");
```

This must be called with a real user session, not the service-role key. After ownership is
claimed, add further trusted users deliberately with the service role if the policy ever
changes. Domain tables and RPCs are not accessible anonymously.

The implemented RPCs are:

- `rezept_erstellen`, `rezeptversion_erstellen`, `rezeptversion_freigeben`,
  `rezeptversion_loeschen`
- `sud_aus_rezept_erstellen`
- `lagerbewegung_erfassen`, `sudzutat_verbrauch_netto`, `sudzutat_ist_menge_setzen`,
  `sudzutat_ersetzen`
- `naechste_sudnummer`, `zugang_beanspruchen`

## Supabase free-plan constraints

Verified against <https://supabase.com/pricing> on 2026-11-03:

- 500 MB database size per project.
- 2 active Free projects per organization; additional projects can be paused.
- Free projects are paused after **1 week of inactivity**.
- 5 GB egress and 5 GB cached egress per month.
- 1 GB file storage.
- **No automatic backups** on the Free plan. See the backup section below.
- 50,000 monthly active users.

The free plan is suitable for setup and low-volume personal use. Do not rely on it for
important brewing history without a tested export procedure and an agreed upgrade path.

## Deployment

Not yet deployed: a hosted Supabase project and hosting account are required.

Recommended host: Vercel Hobby (free for personal, non-commercial use). Current key Hobby
allowances, verified on 2026-11-03:

- 1M CDN requests/month and 100 GB fast data transfer/month.
- 1M function invocations/month, 4 hours of Fluid active CPU, and 360 GB-hours of
  provisioned memory/month.
- 1 hour of runtime logs.

Deployment checklist:

1. Create the hosted Supabase project and record its project reference (not secrets).
2. Set the hosted Auth Site URL and redirect allowlist; include the production `/protected`
   and `/auth/update-password` URLs.
3. Configure `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the host's environment settings.
4. Build command: `bun run build`. Install command: `bun install --frozen-lockfile`.
5. Apply reviewed migrations deliberately; keep local resets separate from hosted changes.
6. Verify signup, confirmation, login, logout, and recovery against the production URLs.

Supabase hosts the database and Auth; it does **not** host this Next.js application.

## Backup and restoration

The Free plan has no automatic backups, so backups are manual:

```sh
# Schema (custom roles excluded by default)
bunx supabase db dump --linked -f backups/schema.sql

# Data only
bunx supabase db dump --linked --data-only -f backups/data.sql

# Roles, if custom roles are introduced later
bunx supabase db dump --linked --role-only -f backups/roles.sql
```

- Store backups outside the repository; they are not committed.
- Test restoration against a scratch local database before relying on a backup.
- Supabase's `db dump` excludes managed schemas such as `auth` and `storage`. Follow the
  documented privilege note before restoring: revoke default table privileges from `anon`
  and `authenticated` in the target database before applying the dump.
- Do not store important brewing history until export and restoration have been rehearsed.

## Quality checks

```sh
bun install --frozen-lockfile
bun run typecheck
bun run check
bun run test
bun run test:integration
bun run build
```

Current coverage: unit tests for the starter helper and Zod domain validation, plus 27
PostgreSQL integration tests covering RLS, recipe/version lifecycle, copy semantics,
substitution, inventory movements, corrections, idempotency, concurrency, equipment
snapshots, archiving, and destructive-delete protection.

## Project structure

```text
app/                  Starter pages and auth routes
components/           Starter UI and auth components
lib/supabase/         Browser, server, and proxy clients with generated Database types
lib/database.types.ts Generated Supabase types
lib/domain/           Zod validation and local PostgreSQL acceptance tests
docs/                 Setup decisions and domain conventions
proxy.ts              Next.js 16 proxy/session-refresh entry point
supabase/migrations/  Ordered brewing migrations
supabase/config.toml  Local Supabase configuration
```

## Attribution

Application foundation based on the official Next.js `with-supabase` example, licensed
under the Next.js repository's MIT license. Grove was consulted only for dependency
decisions; no Grove application code, structure, or configuration was imported.
