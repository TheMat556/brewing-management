import { existsSync, readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { expect } from "vitest";

import type { Database } from "../../database.types";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(".env.test.local");

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Create .env.test.local from the local Supabase status before running integration tests.`,
    );
  }
  return value;
}

const apiUrl = required("TEST_SUPABASE_URL");
const databaseUrl = required("TEST_DATABASE_URL");
const publishableKey = required("TEST_SUPABASE_PUBLISHABLE_KEY");
const serviceRoleKey = required("TEST_SUPABASE_SERVICE_ROLE_KEY");

const apiHost = new URL(apiUrl).hostname;
const databaseHost = new URL(databaseUrl).hostname;
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);

if (!localHosts.has(apiHost) || !localHosts.has(databaseHost)) {
  throw new Error("Refusing to run integration tests against a non-local Supabase target");
}
if (new URL(databaseUrl).port !== "54322") {
  throw new Error("Refusing to run integration tests against a non-local database port");
}

export const db = new Pool({ connectionString: databaseUrl, max: 10 });

export const service = createClient<Database>(apiUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const anon = createClient<Database>(apiUrl, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type TestUser = {
  email: string;
  id: string;
  client: SupabaseClient<Database>;
};

const testPassword = "BrewingTestPass123!";

export async function createTestUser(label: string): Promise<TestUser> {
  const email = `vitest.${label}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: testPassword,
    email_confirm: true,
  });
  if (error) throw error;

  const client = createClient<Database>(apiUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: testPassword,
  });
  if (signInError) throw signInError;

  return { email, id: data.user.id, client };
}

export async function deleteTestUser(user: TestUser) {
  await service.auth.admin.deleteUser(user.id).catch(() => undefined);
}

export async function sql<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await db.query(query, params);
  return result.rows as T[];
}

export async function resetDomainData() {
  await db.query(`
    truncate table
      public.tb_lagerbewegung,
      public.tb_idempotenz,
      public.tb_sudgeraet,
      public.tb_sudzutat,
      public.tb_sudschritt,
      public.tb_sud,
      public.tb_rezeptzutat,
      public.tb_rezeptschritt,
      public.tb_rezeptversion,
      public.tb_rezept,
      public.tb_lagercharge,
      public.tb_rohstoff,
      public.tb_geraet,
      public.tb_berechtigter_benutzer
    restart identity cascade
  `);
  await db.query("alter sequence public.tb_sud_nummer_seq restart with 1");
}

export function unwrap<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null || result.data === undefined) {
    throw new Error("Expected a non-null RPC result");
  }
  return result.data as NonNullable<T>;
}

export async function expectSqlError(promise: Promise<unknown>, pattern: RegExp) {
  await expect(promise).rejects.toThrow(pattern);
}
