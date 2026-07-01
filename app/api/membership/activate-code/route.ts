import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/d1";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const VALID_CODES = ["FREELANCER2026", "JIEBAO2026", "EARLYBIRD2026"];

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { code?: string } | null;
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!VALID_CODES.includes(code)) {
      return NextResponse.json({ error: "邀请码无效" }, { status: 400 });
    }

    const db = getDb();
    const now = Date.now();

    const orderResult = await db
      .prepare(
        "INSERT INTO orders (user_id, amount, status, payment_method, note, created_at, updated_at) VALUES (?, 0, 'paid', 'invite', ?, ?, ?)"
      )
      .bind(user.id, code, now, now)
      .run();

    const orderId = orderResult.meta.last_row_id as number;

    const existing = await db
      .prepare("SELECT id FROM memberships WHERE user_id = ?")
      .bind(user.id)
      .first<{ id: number }>();

    if (existing) {
      await db
        .prepare(
          "UPDATE memberships SET active = 1, starts_at = ?, order_id = ?, updated_at = ? WHERE id = ?"
        )
        .bind(now, orderId, now, existing.id)
        .run();
    } else {
      await db
        .prepare(
          "INSERT INTO memberships (user_id, active, starts_at, order_id, created_at, updated_at) VALUES (?, 1, ?, ?, ?, ?)"
        )
        .bind(user.id, now, orderId, now, now)
        .run();
    }

    return NextResponse.json({ ok: true, message: "邀请码激活成功" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "激活失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
