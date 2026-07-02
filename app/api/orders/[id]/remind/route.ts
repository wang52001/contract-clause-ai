import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/d1";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (!Number.isFinite(orderId)) {
      return NextResponse.json({ error: "订单ID无效" }, { status: 400 });
    }

    const db = getDb();
    const now = Date.now();

    const order = await db
      .prepare("SELECT id, user_id, status FROM orders WHERE id = ?")
      .bind(orderId)
      .first<{ id: number; user_id: number; status: string }>();

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "该订单已处理，无需催促" }, { status: 400 });
    }

    // 检查最近 5 分钟内是否已经催过
    const lastRemind = await db
      .prepare(
        "SELECT id FROM order_messages WHERE order_id = ? AND role = 'user' AND content LIKE '【催一催】%' AND created_at > ?"
      )
      .bind(orderId, now - 5 * 60 * 1000)
      .first<{ id: number }>();

    if (lastRemind) {
      return NextResponse.json({ error: "5 分钟内已经催促过了，请耐心等待" }, { status: 429 });
    }

    await db
      .prepare("INSERT INTO order_messages (order_id, user_id, role, content, created_at) VALUES (?, ?, 'user', ?, ?)")
      .bind(orderId, user.id, `【催一催】用户催促处理订单，请尽快确认收款。`, now)
      .run();

    return NextResponse.json({ ok: true, message: "已提醒管理员" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "催促失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
