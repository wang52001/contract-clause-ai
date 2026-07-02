import { NextRequest, NextResponse } from "next/server";
import { getDb, getEnv } from "@/lib/db/d1";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function getAdminSecret(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
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

    const body = (await req.json().catch(() => null)) as { content?: string } | null;
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content || content.length > 500) {
      return NextResponse.json({ error: "回复内容不能为空，且不超过500字" }, { status: 400 });
    }

    const db = getDb();
    const now = Date.now();

    const order = await db
      .prepare("SELECT id, user_id FROM orders WHERE id = ?")
      .bind(orderId)
      .first<{ id: number; user_id: number }>();

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    await db
      .prepare(
        "INSERT INTO order_messages (order_id, user_id, role, content, created_at) VALUES (?, ?, 'admin', ?, ?)"
      )
      .bind(orderId, order.user_id, content, now)
      .run();

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "回复失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
