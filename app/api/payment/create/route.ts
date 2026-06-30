import { NextRequest, NextResponse } from "next/server";
import {
  buildCreateOrderUrl,
  generateOutTradeNo,
  isConfigured,
  type PayType,
} from "@/lib/payment/zpay";
import { createOrder } from "@/lib/payment/orders";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const PRICE = "9.90";

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      { ok: false, error: "PAYMENT_NOT_CONFIGURED", message: "支付未配置，请使用邀请码激活。" },
      { status: 503 }
    );
  }

  let body: { type?: PayType } = {};
  try {
    body = await req.json();
  } catch {}
  const type: PayType = body.type === "wxpay" ? "wxpay" : body.type === "qqpay" ? "qqpay" : "alipay";

  const outTradeNo = generateOutTradeNo();
  const origin = new URL(req.url).origin;

  createOrder({ outTradeNo, money: PRICE, type });

  const { url } = await buildCreateOrderUrl({
    outTradeNo,
    name: "接单护身符 · 单份报告会员",
    money: PRICE,
    type,
    notifyUrl: `${origin}/api/payment/notify`,
    returnUrl: `${origin}/api/payment/return?out_trade_no=${outTradeNo}`,
  });

  return NextResponse.json({ ok: true, url, outTradeNo });
}
