import { NextRequest, NextResponse } from "next/server";
import { verifyNotify } from "@/lib/payment/zpay";
import { getOrder, markPaid, cleanup } from "@/lib/payment/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  cleanup();

  const url = new URL(req.url);
  const params: Record<string, string> = {};
  if (req.method === "POST") {
    try {
      const form = await req.formData();
      form.forEach((v, k) => {
        params[k] = String(v);
      });
    } catch {
      return new NextResponse("fail", { status: 400 });
    }
  } else {
    url.searchParams.forEach((v, k) => {
      params[k] = v;
    });
  }

  if (!verifyNotify(params)) {
    return new NextResponse("fail", { status: 400 });
  }

  const outTradeNo = params.out_trade_no;
  const tradeNo = params.trade_no ?? "";
  const tradeStatus = params.trade_status ?? "";

  if (!outTradeNo) return new NextResponse("fail", { status: 400 });

  const order = getOrder(outTradeNo);
  if (!order) return new NextResponse("fail", { status: 404 });

  if (tradeStatus === "TRADE_SUCCESS") {
    markPaid(outTradeNo, tradeNo);
  }

  return new NextResponse("success", { status: 200 });
}
