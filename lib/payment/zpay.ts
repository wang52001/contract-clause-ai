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

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function md5(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("MD5", data);
  return bytesToHex(new Uint8Array(buffer));
}

export function generateOutTradeNo(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomHex(4).toUpperCase();
  return `FCG${ts}${rand}`;
}

export async function sign(params: Record<string, string>): Promise<string> {
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== "" && k !== "sign" && k !== "sign_type")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return md5(sorted + ZPAY_KEY);
}

export async function verifyNotify(params: Record<string, string>): Promise<boolean> {
  if (!isConfigured()) return false;
  const incoming = params.sign;
  if (!incoming) return false;
  const expected = await sign(params);
  return incoming.toLowerCase() === expected.toLowerCase();
}

export async function buildCreateOrderUrl(params: CreateOrderParams): Promise<CreateOrderResult> {
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
  payload.sign = await sign(payload);
  const query = new URLSearchParams(payload).toString();
  return { url: `${ZPAY_API}?${query}`, params: payload, sign: payload.sign };
}
