import { NextRequest, NextResponse } from "next/server";
import { getDb, getEnv } from "@/lib/db/d1";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function getAdminSecret(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const secret = getAdminSecret(req);
    if (!secret || secret !== getEnv().ADMIN_SECRET) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "订单 ID 无效" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as { sendInviteCode?: boolean } | null;
    const sendInviteCode = body?.sendInviteCode === true;

    const db = getDb();
    const now = Date.now();

    const order = await db
      .prepare("SELECT id, user_id, status, quantity FROM orders WHERE id = ?")
      .bind(orderId)
      .first<{ id: number; user_id: number; status: string; quantity: number }>();

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "订单状态不是待付款" }, { status: 400 });
    }

    await db
      .prepare(
        "UPDATE orders SET status = 'paid', paid_at = ?, updated_at = ?, confirmed_by = 'admin' WHERE id = ?"
      )
      .bind(now, now, orderId)
      .run();

    const creditsToAdd = order.quantity || 1;
    const existing = await db
      .prepare("SELECT id, credits FROM memberships WHERE user_id = ?")
      .bind(order.user_id)
      .first<{ id: number; credits: number }>();

    if (existing) {
      await db
        .prepare(
          "UPDATE memberships SET active = 1, credits = credits + ?, starts_at = ?, order_id = ?, updated_at = ? WHERE id = ?"
        )
        .bind(creditsToAdd, now, orderId, now, existing.id)
        .run();
    } else {
      await db
        .prepare(
          "INSERT INTO memberships (user_id, active, credits, starts_at, order_id, created_at, updated_at) VALUES (?, 1, ?, ?, ?, ?, ?)"
        )
        .bind(order.user_id, creditsToAdd, now, orderId, now, now)
        .run();
    }

    let inviteCode: string | null = null;
    if (sendInviteCode) {
      let code = generateInviteCode();
      let tries = 0;
      while (tries < 5) {
        try {
          await db
            .prepare("INSERT INTO invite_codes (code, order_id, created_at) VALUES (?, ?, ?)")
            .bind(code, orderId, now)
            .run();
          break;
        } catch {
          code = generateInviteCode();
          tries++;
        }
      }
      inviteCode = code;

      await db
        .prepare(
          "INSERT INTO order_messages (order_id, user_id, role, content, created_at) VALUES (?, ?, 'admin', ?, ?)"
        )
        .bind(
          orderId,
          order.user_id,
          `【已确认收款】已到账 ${creditsToAdd} 份分析次数。邀请码：${inviteCode}（一次性，请及时使用）`,
          now
        )
        .run();
    } else {
      await db
        .prepare(
          "INSERT INTO order_messages (order_id, user_id, role, content, created_at) VALUES (?, ?, 'admin', ?, ?)"
        )
        .bind(orderId, order.user_id, `【已确认收款】已到账 ${creditsToAdd} 份分析次数。`, now)
        .run();
    }

    return NextResponse.json({
      ok: true,
      message: `已确认收款，到账 ${creditsToAdd} 份分析次数`,
      inviteCode,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "确认失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
