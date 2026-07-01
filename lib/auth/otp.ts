import { getDb } from "@/lib/db/d1";

const CODE_TTL_MS = 10 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const IP_MAX_ATTEMPTS = 5;
const IP_WINDOW_MS = 10 * 60 * 1000;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"
  );
}

export async function sendOtp(request: Request, email: string): Promise<{ ok: boolean; message: string; code?: string }> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const now = Date.now();

  const ip = getClientIp(request);
  const recentIpCount = await db
    .prepare(
      "SELECT COUNT(*) as count FROM verification_codes WHERE created_at > ? AND ip = ?"
    )
    .bind(now - IP_WINDOW_MS, ip)
    .first<{ count: number }>();

  if (recentIpCount && recentIpCount.count >= IP_MAX_ATTEMPTS) {
    return { ok: false, message: "该网络请求过于频繁，请 10 分钟后再试" };
  }

  const latest = await db
    .prepare(
      "SELECT created_at FROM verification_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1"
    )
    .bind(normalized)
    .first<{ created_at: number }>();

  if (latest && now - latest.created_at < SEND_COOLDOWN_MS) {
    return { ok: false, message: "验证码已发送，请 60 秒后再试" };
  }

  const code = generateCode();
  const expiresAt = now + CODE_TTL_MS;

  await db
    .prepare(
      "INSERT INTO verification_codes (email, code, expires_at, created_at, ip) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(normalized, code, expiresAt, now, ip)
    .run();

  return { ok: true, message: "验证码已发送", code };
}

export async function verifyOtp(email: string, code: string): Promise<{ ok: boolean; message: string }> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const now = Date.now();

  const record = await db
    .prepare(
      "SELECT id, code, expires_at, used_at, attempts FROM verification_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1"
    )
    .bind(normalized)
    .first<{ id: number; code: string; expires_at: number; used_at: number | null; attempts: number }>();

  if (!record) {
    return { ok: false, message: "验证码不存在，请重新获取" };
  }

  if (record.used_at) {
    return { ok: false, message: "验证码已使用，请重新获取" };
  }

  if (record.expires_at < now) {
    return { ok: false, message: "验证码已过期，请重新获取" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, message: "验证码错误次数过多，请重新获取" };
  }

  await db
    .prepare("UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?")
    .bind(record.id)
    .run();

  if (record.code !== code.trim()) {
    return { ok: false, message: "验证码错误" };
  }

  await db
    .prepare("UPDATE verification_codes SET used_at = ? WHERE id = ?")
    .bind(now, record.id)
    .run();

  return { ok: true, message: "验证成功" };
}
