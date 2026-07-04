import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/d1";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ user: null, isMember: false });
    }

    const db = getDb();
    const now = Date.now();

    const user = await db
      .prepare("SELECT id, email, invite_code, invite_count FROM users WHERE id = ?")
      .bind(sessionUser.id)
      .first<{ id: number; email: string; invite_code: string | null; invite_count: number }>();

    const membership = await db
      .prepare(
        "SELECT active, expires_at, credits FROM memberships WHERE user_id = ? AND active = 1"
      )
      .bind(sessionUser.id)
      .first<{ active: number; expires_at: number | null; credits: number }>();

    const previewRow = await db
      .prepare("SELECT id FROM user_previews WHERE user_id = ?")
      .bind(sessionUser.id)
      .first<{ id: number }>();

    const isMember = Boolean(
      membership && (membership.expires_at === null || membership.expires_at > now)
    );
    const credits = membership?.credits ?? 0;

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      isMember,
      credits,
      inviteCode: user?.invite_code ?? null,
      inviteCount: user?.invite_count ?? 0,
      previewUsed: Boolean(previewRow),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "获取用户信息失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
