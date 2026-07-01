import { NextRequest, NextResponse } from "next/server";
import { destroySession, clearSessionCookie } from "@/lib/auth/session";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await destroySession(req);
    const response = NextResponse.json({ ok: true });
    response.headers.set("Set-Cookie", clearSessionCookie());
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "退出失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
