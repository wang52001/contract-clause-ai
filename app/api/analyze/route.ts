import { NextRequest, NextResponse } from "next/server";
import { analyzeContract } from "@/lib/ai/parse";
import { assessRisk } from "@/lib/scoring/risk";
import { getDb } from "@/lib/db/d1";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MIN_LENGTH = 80;
const MAX_LENGTH = 60000;
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;

const requestLog = new Map<string, number[]>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const arr = requestLog.get(key) ?? [];
  const recent = arr.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  requestLog.set(key, recent);
  return true;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { text?: string; mode?: string } | null;
    const { text, mode } = body ?? {};

    if (typeof text !== "string" || text.trim().length < MIN_LENGTH) {
      return NextResponse.json(
        { error: `合同文本过短，至少需要 ${MIN_LENGTH} 个字符` },
        { status: 400 }
      );
    }
    if (text.length > MAX_LENGTH) {
      return NextResponse.json(
        { error: `合同文本过长，最多 ${MAX_LENGTH} 个字符` },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const user = await getSessionUser(req);
    const db = getDb();
    let creditsAfter = 0;

    if (user) {
      const membership = await db
        .prepare("SELECT id, credits FROM memberships WHERE user_id = ? AND active = 1")
        .bind(user.id)
        .first<{ id: number; credits: number }>();

      if (!membership || membership.credits <= 0) {
        return NextResponse.json(
          { error: "分析次数已用完，请去购买套餐", code: "NO_CREDITS" },
          { status: 403 }
        );
      }

      await db
        .prepare("UPDATE memberships SET credits = credits - 1, updated_at = ? WHERE id = ?")
        .bind(Date.now(), membership.id)
        .run();

      creditsAfter = membership.credits - 1;
    } else {
      return NextResponse.json(
        { error: "请先登录后再分析", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const analyzeMode = mode === "deep" ? "deep" : "basic";

    const startedAt = Date.now();
    const result = await analyzeContract(text, { mode: analyzeMode });
    const elapsedMs = Date.now() - startedAt;

    const risk = assessRisk(result);

    return NextResponse.json({
      result,
      risk,
      credits: creditsAfter,
      meta: { mode: analyzeMode, elapsedMs, clauseCount: result.clauses.length },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "分析失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
