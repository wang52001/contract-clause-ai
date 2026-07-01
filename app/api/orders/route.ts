import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/d1";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { paymentMethod?: string; amount?: number; note?: string } | null;
    const paymentMethod = body?.paymentMethod === "alipay" ? "alipay" : "wxpay";
    const amount = typeof body?.amount === "number" && body.amount > 0 ? body.amount : 990;
    const note = typeof body?.note === "string" ? body.note : "";

    const db = getDb();
    const now = Date.now();

    const result = await db
      .prepare(
        "INSERT INTO orders (user_id, amount, status, payment_method, note, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?, ?, ?)"
      )
      .bind(user.id, amount, paymentMethod, note, now, now)
      .run();

    const orderId = result.meta.last_row_id as number;

    return NextResponse.json({
      ok: true,
      order: {
        id: orderId,
        amount,
        status: "pending",
        paymentMethod,
        note,
        createdAt: now,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "创建订单失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const db = getDb();
    const { results } = await db
      .prepare(
        "SELECT id, amount, status, payment_method, note, created_at, paid_at FROM orders WHERE user_id = ? ORDER BY created_at DESC"
      )
      .bind(user.id)
      .all<{
        id: number;
        amount: number;
        status: string;
        payment_method: string;
        note: string;
        created_at: number;
        paid_at: number | null;
      }>();

    const orders = results.map((r) => ({
      id: r.id,
      amount: r.amount,
      status: r.status,
      paymentMethod: r.payment_method,
      note: r.note,
      createdAt: r.created_at,
      paidAt: r.paid_at,
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "获取订单失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
