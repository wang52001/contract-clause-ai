import { NextRequest, NextResponse } from "next/server";
import { getDb, getEnv } from "@/lib/db/d1";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function getAdminSecret(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(req: NextRequest) {
  try {
    const secret = getAdminSecret(req);
    if (!secret || secret !== getEnv().ADMIN_SECRET) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const db = getDb();
    const { results } = await db
      .prepare(
        `SELECT ic.id, ic.code, ic.order_id, ic.used_by, ic.used_at, ic.created_at, u.email as used_email
         FROM invite_codes ic
         LEFT JOIN users u ON ic.used_by = u.id
         ORDER BY ic.created_at DESC
         LIMIT 100`
      )
      .all<{ id: number; code: string; order_id: number | null; used_by: number | null; used_at: number | null; created_at: number; used_email: string | null }>();

    return NextResponse.json({
      codes: results.map((r) => ({
        id: r.id,
        code: r.code,
        orderId: r.order_id,
        usedBy: r.used_by,
        usedAt: r.used_at,
        createdAt: r.created_at,
        usedEmail: r.used_email,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "获取失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = getAdminSecret(req);
    if (!secret || secret !== getEnv().ADMIN_SECRET) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as { count?: number } | null;
    const count = typeof body?.count === "number" && body.count > 0 ? Math.min(body.count, 20) : 1;

    const db = getDb();
    const now = Date.now();
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      let code = generateInviteCode();
      let tries = 0;
      while (tries < 10) {
        try {
          await db
            .prepare("INSERT INTO invite_codes (code, created_at) VALUES (?, ?)")
            .bind(code, now)
            .run();
          codes.push(code);
          break;
        } catch {
          code = generateInviteCode();
          tries++;
        }
      }
    }

    return NextResponse.json({ ok: true, codes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "创建失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
