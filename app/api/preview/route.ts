import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/d1";
import { getSessionUser } from "@/lib/auth/session";
import type { AnalysisResult } from "@/lib/ai/schema";
import type { RiskAssessment } from "@/lib/scoring/risk";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const db = getDb();
    const row = await db
      .prepare("SELECT result, risk, meta, created_at FROM user_previews WHERE user_id = ?")
      .bind(user.id)
      .first<{ result: string; risk: string; meta: string; created_at: number }>();

    if (!row) {
      return NextResponse.json({ preview: null });
    }

    return NextResponse.json({
      preview: {
        result: JSON.parse(row.result) as AnalysisResult,
        risk: JSON.parse(row.risk) as RiskAssessment,
        meta: JSON.parse(row.meta) as { mode: string; elapsedMs: number; clauseCount: number },
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "获取预览记录失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
