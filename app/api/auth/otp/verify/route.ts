import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/auth/otp";
import { createUserIfNotExists, createSession, setSessionCookie } from "@/lib/auth/session";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: string; code?: string; inviteCode?: string } | null;
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!email || !code) {
      return NextResponse.json({ error: "邮箱和验证码不能为空" }, { status: 400 });
    }

    const verifyResult = await verifyOtp(email, code);
    if (!verifyResult.ok) {
      return NextResponse.json({ error: verifyResult.message }, { status: 400 });
    }

    const inviteCode = typeof body?.inviteCode === "string" ? body.inviteCode.trim() : undefined;
    const userId = await createUserIfNotExists(email, inviteCode);
    const token = await createSession(userId);

    const response = NextResponse.json({
      ok: true,
      user: { id: userId, email: email.toLowerCase() },
    });
    response.headers.set("Set-Cookie", setSessionCookie(token));
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "登录失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
