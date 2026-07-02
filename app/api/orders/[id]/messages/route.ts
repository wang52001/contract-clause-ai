import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/d1";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const order = await db
      .prepare("SELECT id, user_id, status FROM orders WHERE id = ?")
      .bind(orderId)
      .first<{ id: number; user_id: number; status: string }>();

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    const { results } = await db
      .prepare(
        `SELECT m.id, m.role, m.content, m.created_at, u.email as sender_email
         FROM order_messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.order_id = ?
         ORDER BY m.created_at ASC`
      )
      .bind(orderId)
      .all<{ id: number; role: string; content: string; created_at: number; sender_email: string }>();

    return NextResponse.json({
      messages: results.map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        createdAt: r.created_at,
        senderEmail: r.sender_email,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "获取消息失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

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

    const body = (await req.json().catch(() => null)) as { content?: string } | null;
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content || content.length > 500) {
      return NextResponse.json({ error: "留言内容不能为空，且不超过500字" }, { status: 400 });
    }

    const db = getDb();
    const now = Date.now();

    const order = await db
      .prepare("SELECT id, user_id FROM orders WHERE id = ?")
      .bind(orderId)
      .first<{ id: number; user_id: number }>();

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    await db
      .prepare("INSERT INTO order_messages (order_id, user_id, role, content, created_at) VALUES (?, ?, 'user', ?, ?)")
      .bind(orderId, user.id, content, now)
      .run();

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "发送留言失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
