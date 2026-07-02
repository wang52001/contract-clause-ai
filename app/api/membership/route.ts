import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/d1";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ isMember: false });
    }

    const db = getDb();
    const now = Date.now();

    const membership = await db
      .prepare(
        "SELECT active, expires_at FROM memberships WHERE user_id = ? AND active = 1"
      )
      .bind(user.id)
      .first<{ active: number; expires_at: number | null; credits: number }>();

    const isMember = Boolean(
      membership && (membership.expires_at === null || membership.expires_at > now)
    );
    const credits = membership?.credits ?? 0;

    return NextResponse.json({ isMember, credits });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "获取会员状态失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
