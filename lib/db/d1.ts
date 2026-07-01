import { getRequestContext } from "@cloudflare/next-on-pages";

export function getDb(): D1Database {
  const ctx = getRequestContext();
  const env = ctx.env as unknown as { DB?: D1Database };
  const db = env.DB;
  if (!db) {
    throw new Error("D1 database binding 'DB' is not configured");
  }
  return db;
}

export interface EnvBindings {
  DB: D1Database;
  DEEPSEEK_API_KEY: string;
  ADMIN_SECRET: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  EMAIL_PROVIDER?: string;
}

export function getEnv(): EnvBindings {
  const ctx = getRequestContext();
  return ctx.env as unknown as EnvBindings;
}
