import { NextRequest, NextResponse } from "next/server";
import { getDb, getEnv } from "@/lib/db/d1";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function getAdminSecret(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export async function GET(req: NextRequest) {
  try {
    const secret = getAdminSecret(req);
    if (!secret || secret !== getEnv().ADMIN_SECRET) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const db = getDb();
    const { results } = await db
      .prepare(
        `SELECT o.id, o.amount, o.status, o.payment_method, o.note, o.created_at, o.paid_at, u.email,
                (SELECT COUNT(*) FROM order_messages m WHERE m.order_id = o.id) as message_count,
                (SELECT MAX(m.created_at) FROM order_messages m WHERE m.order_id = o.id) as last_message_at
         FROM orders o
         JOIN users u ON o.user_id = u.id
         ORDER BY 
           CASE WHEN o.status = 'pending' THEN 0 ELSE 1 END,
           last_message_at DESC,
           o.created_at DESC
         LIMIT 200`
      )
      .all<{
        id: number;
        amount: number;
        status: string;
        payment_method: string;
        note: string;
        created_at: number;
        paid_at: number | null;
        email: string;
        message_count: number;
        last_message_at: number | null;
      }>();

    const orders = results.map((r) => ({
      id: r.id,
      amount: r.amount,
      status: r.status,
      paymentMethod: r.payment_method,
      note: r.note,
      createdAt: r.created_at,
      paidAt: r.paid_at,
      email: r.email,
      messageCount: r.message_count,
      lastMessageAt: r.last_message_at,
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "获取订单失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
