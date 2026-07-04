import { getDb } from "@/lib/db/d1";

const SESSION_DAYS = 30;
const COOKIE_NAME = "fcg_session";

export interface SessionUser {
  id: number;
  email: string;
}

async function tokenHash(token: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export async function createSession(userId: number): Promise<string> {
  const db = getDb();
  const token = crypto.randomUUID();
  const hash = await tokenHash(token);
  const now = Date.now();
  const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000;

  await db
    .prepare(
      "INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)"
    )
    .bind(userId, hash, expiresAt, now)
    .run();

  return token;
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;

  const token = decodeURIComponent(match[1]);
  const hash = await tokenHash(token);
  const now = Date.now();

  const db = getDb();
  const row = await db
    .prepare(
      `SELECT s.user_id, u.email
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token_hash = ? AND s.expires_at > ?`
    )
    .bind(hash, now)
    .first<{ user_id: number; email: string }>();

  if (!row) return null;
  return { id: row.user_id, email: row.email };
}

export async function destroySession(request: Request): Promise<void> {
  const cookie = request.headers.get("cookie");
  if (!cookie) return;

  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return;

  const token = decodeURIComponent(match[1]);
  const hash = await tokenHash(token);

  const db = getDb();
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hash).run();
}

export function setSessionCookie(token: string): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createUserIfNotExists(email: string, inviterCode?: string): Promise<number> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const now = Date.now();

  const existing = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(normalized)
    .first<{ id: number }>();

  if (existing) return existing.id;

  const inviteCode = generateInviteCode();

  const result = await db
    .prepare("INSERT INTO users (email, invite_code, created_at, updated_at) VALUES (?, ?, ?, ?)")
    .bind(normalized, inviteCode, now, now)
    .run();

  const userId = result.meta.last_row_id as number;

  await db
    .prepare(
      "INSERT OR IGNORE INTO memberships (user_id, active, starts_at, expires_at, created_at, updated_at, credits) VALUES (?, 1, ?, NULL, ?, ?, 0)"
    )
    .bind(userId, now, now, now)
    .run();

  if (inviterCode) {
    const inviter = await db
      .prepare("SELECT id FROM users WHERE invite_code = ?")
      .bind(inviterCode.trim().toUpperCase())
      .first<{ id: number }>();

    if (inviter && inviter.id !== userId) {
      await db.prepare("UPDATE users SET invited_by = ? WHERE id = ?").bind(inviter.id, userId).run();
      await db.prepare("UPDATE users SET invite_count = invite_count + 1 WHERE id = ?").bind(inviter.id).run();

      const updated = await db
        .prepare("SELECT invite_count FROM users WHERE id = ?")
        .bind(inviter.id)
        .first<{ invite_count: number }>();

      if (updated && updated.invite_count > 0 && updated.invite_count % 3 === 0) {
        const membership = await db
          .prepare("SELECT id FROM memberships WHERE user_id = ? AND active = 1")
          .bind(inviter.id)
          .first<{ id: number }>();

        if (membership) {
          await db
            .prepare("UPDATE memberships SET credits = credits + 1, updated_at = ? WHERE id = ?")
            .bind(now, membership.id)
            .run();
        } else {
          await db
            .prepare(
              "INSERT OR IGNORE INTO memberships (user_id, active, starts_at, expires_at, created_at, updated_at, credits) VALUES (?, 1, ?, NULL, ?, ?, 1)"
            )
            .bind(inviter.id, now, now, now)
            .run();
        }
      }
    }
  }

  return userId;
}

export async function getUserByEmail(email: string): Promise<SessionUser | null> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const row = await db
    .prepare("SELECT id, email FROM users WHERE email = ?")
    .bind(normalized)
    .first<{ id: number; email: string }>();

  if (!row) return null;
  return row;
}
