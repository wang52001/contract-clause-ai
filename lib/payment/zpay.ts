import { createHash, randomBytes } from "crypto";

export const ZPAY_PID = process.env.ZPAY_PID ?? "";
export const ZPAY_KEY = process.env.ZPAY_KEY ?? "";
export const ZPAY_API = process.env.ZPAY_API_URL ?? "https://api.z-pay.uk/api/pay/create";

export type PayType = "alipay" | "wxpay" | "qqpay";

export interface CreateOrderParams {
  outTradeNo: string;
  name: string;
  money: string;
  type: PayType;
  notifyUrl: string;
  returnUrl: string;
}

export interface CreateOrderResult {
  url: string;
  params: Record<string, string>;
  sign: string;
}

export function isConfigured(): boolean {
  return Boolean(ZPAY_PID && ZPAY_KEY);
}

export function generateOutTradeNo(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return `FCG${ts}${rand}`;
}

export function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== "" && k !== "sign" && k !== "sign_type")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("md5")
    .update(sorted + ZPAY_KEY, "utf8")
    .digest("hex");
}

export function verifyNotify(params: Record<string, string>): boolean {
  if (!isConfigured()) return false;
  const incoming = params.sign;
  if (!incoming) return false;
  const expected = sign(params);
  return incoming.toLowerCase() === expected.toLowerCase();
}

export function buildCreateOrderUrl(params: CreateOrderParams): CreateOrderResult {
  const payload: Record<string, string> = {
    pid: ZPAY_PID,
    type: params.type,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl,
    return_url: params.returnUrl,
    name: params.name,
    money: params.money,
    clientip: "1.1.1.1",
    sign: "",
    sign_type: "MD5",
  };
  payload.sign = sign(payload);
  const query = new URLSearchParams(payload).toString();
  return { url: `${ZPAY_API}?${query}`, params: payload, sign: payload.sign };
}
