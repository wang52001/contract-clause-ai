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
        `SELECT o.id, o.amount, o.status, o.payment_method, o.note, o.created_at, o.paid_at, u.email
         FROM orders o
         JOIN users u ON o.user_id = u.id
         WHERE o.status = 'pending'
         ORDER BY o.created_at DESC`
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
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "获取订单失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
