import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/d1";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// 保留几个通用测试码（每个用户仍只能激活一次）
const LEGACY_CODES = ["FREELANCER2026", "JIEBAO2026", "EARLYBIRD2026"];

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { code?: string } | null;
    const rawCode = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!rawCode) {
      return NextResponse.json({ error: "请输入邀请码" }, { status: 400 });
    }

    const db = getDb();
    const now = Date.now();

    // 先检查一次性邀请码
    const inviteCode = await db
      .prepare("SELECT id, order_id, used_by, used_at FROM invite_codes WHERE code = ?")
      .bind(rawCode)
      .first<{ id: number; order_id: number | null; used_by: number | null; used_at: number | null }>();

    if (inviteCode) {
      if (inviteCode.used_at || inviteCode.used_by) {
        return NextResponse.json({ error: "邀请码已被使用" }, { status: 400 });
      }

      // 标记为已使用
      await db
        .prepare("UPDATE invite_codes SET used_by = ?, used_at = ? WHERE id = ?")
        .bind(user.id, now, inviteCode.id)
        .run();

      // 如果该码关联了订单，把订单也标记为 paid
      if (inviteCode.order_id) {
        await db
          .prepare("UPDATE orders SET status = 'paid', paid_at = ?, updated_at = ? WHERE id = ?")
          .bind(now, now, inviteCode.order_id)
          .run();
      }
    } else if (LEGACY_CODES.includes(rawCode)) {
      return NextResponse.json({ error: "内测邀请码已结束" }, { status: 400 });
    } else {
      return NextResponse.json({ error: "邀请码无效" }, { status: 400 });
    }

    // 创建或更新订单记录
    const orderResult = await db
      .prepare(
        "INSERT INTO orders (user_id, amount, status, payment_method, note, created_at, updated_at) VALUES (?, 0, 'paid', 'invite', ?, ?, ?)"
      )
      .bind(user.id, rawCode, now, now)
      .run();

    const orderId = orderResult.meta.last_row_id as number;

    // 关联一次性邀请码到订单
    if (inviteCode) {
      await db
        .prepare("UPDATE invite_codes SET order_id = ? WHERE id = ?")
        .bind(orderId, inviteCode.id)
        .run();
    }

    const existing = await db
      .prepare("SELECT id, credits FROM memberships WHERE user_id = ?")
      .bind(user.id)
      .first<{ id: number; credits: number }>();

    if (existing) {
      await db
        .prepare(
          "UPDATE memberships SET active = 1, credits = credits + 1, starts_at = ?, order_id = ?, updated_at = ? WHERE id = ?"
        )
        .bind(now, orderId, now, existing.id)
        .run();
    } else {
      await db
        .prepare(
          "INSERT INTO memberships (user_id, active, credits, starts_at, order_id, created_at, updated_at) VALUES (?, 1, 1, ?, ?, ?, ?)"
        )
        .bind(user.id, now, orderId, now, now)
        .run();
    }

    return NextResponse.json({ ok: true, message: "邀请码激活成功，已到账 1 份分析次数" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "激活失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
