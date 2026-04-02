import { neon } from "@neondatabase/serverless";
import { authConfig } from "./config";

const sql = authConfig.databaseUrl ? neon(authConfig.databaseUrl) : null;

let schemaReadyPromise: Promise<void> | null = null;

export function isAuthDatabaseConfigured() {
  return Boolean(sql);
}

export function getAuthDatabase() {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return sql;
}

export async function ensureAuthDatabaseSchema() {
  if (!sql) return;

  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS auth_users (
          id text PRIMARY KEY,
          email text NOT NULL,
          email_normalized text NOT NULL,
          full_name text NOT NULL,
          company_name text NOT NULL,
          password_hash text NOT NULL,
          role text NOT NULL,
          plan text NOT NULL,
          trial_ends_at text,
          status text NOT NULL,
          created_at text NOT NULL,
          updated_at text NOT NULL
        )
      `;

      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS auth_users_email_normalized_idx
        ON auth_users (email_normalized)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
          token_hash text NOT NULL,
          created_at text NOT NULL,
          updated_at text NOT NULL,
          last_seen_at text NOT NULL,
          expires_at text NOT NULL,
          remember_me boolean NOT NULL,
          ip_address text,
          user_agent text
        )
      `;

      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS auth_sessions_token_hash_idx
        ON auth_sessions (token_hash)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
        ON auth_sessions (user_id)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx
        ON auth_sessions (expires_at)
      `;
    })().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }

  await schemaReadyPromise;
}
