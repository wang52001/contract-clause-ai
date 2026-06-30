import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ts: Date.now(),
    payment: Boolean(process.env.ZPAY_PID && process.env.ZPAY_KEY),
  });
}
