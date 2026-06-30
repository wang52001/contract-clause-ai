import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/payment/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const outTradeNo = url.searchParams.get("out_trade_no") ?? "";
  const order = outTradeNo ? getOrder(outTradeNo) : undefined;

  const paid = order?.status === "paid" ? "1" : "0";
  return NextResponse.redirect(new URL(`/pricing?paid=${paid}`, url.origin));
}
