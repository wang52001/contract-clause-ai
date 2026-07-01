import { NextRequest, NextResponse } from "next/server";
import { sendOtp } from "@/lib/auth/otp";
import { sendVerificationEmail } from "@/lib/email/send";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: string } | null;
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 });
    }

    const result = await sendOtp(req, email);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 429 });
    }

    await sendVerificationEmail(email, result.code!);

    return NextResponse.json({ ok: true, message: "验证码已发送" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "发送失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
