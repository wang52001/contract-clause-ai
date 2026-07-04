import { NextRequest, NextResponse } from "next/server";
import { analyzeContract } from "@/lib/ai/parse";
import { assessRisk } from "@/lib/scoring/risk";
import { getDb } from "@/lib/db/d1";
import { getSessionUser } from "@/lib/auth/session";
import type { AnalysisResult } from "@/lib/ai/schema";
import type { RiskAssessment } from "@/lib/scoring/risk";

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

function buildPreview(full: AnalysisResult): AnalysisResult {
  return {
    overall: full.overall,
    clauses: full.clauses.slice(0, 2).map((c) => ({
      ...c,
      suggested_revision: null,
      negotiation_script: null,
      legal_basis: [],
    })),
    missing_protections: [],
  };
}

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
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
    if (!user) {
      return NextResponse.json(
        { error: "请先登录后再分析", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const db = getDb();
    const now = Date.now();
    const textHash = hashText(text.trim());

    const membership = await db
      .prepare("SELECT id, credits FROM memberships WHERE user_id = ? AND active = 1")
      .bind(user.id)
      .first<{ id: number; credits: number }>();

    // 有次数：走完整版
    if (membership && membership.credits > 0) {
      await db
        .prepare("UPDATE memberships SET credits = credits - 1, updated_at = ? WHERE id = ?")
        .bind(now, membership.id)
        .run();

      const analyzeMode = mode === "deep" ? "deep" : "basic";
      const startedAt = Date.now();
      const result = await analyzeContract(text, { mode: analyzeMode });
      const elapsedMs = Date.now() - startedAt;
      const risk = assessRisk(result);

      return NextResponse.json({
        result,
        risk,
        credits: membership.credits - 1,
        preview: false,
        meta: {
          mode: analyzeMode,
          elapsedMs,
          clauseCount: result.clauses.length,
        },
      });
    }

    // 无次数：检查是否已有免费预览记录
    const existingPreview = await db
      .prepare("SELECT result, risk, meta FROM user_previews WHERE user_id = ?")
      .bind(user.id)
      .first<{ result: string; risk: string; meta: string }>();

    if (existingPreview) {
      return NextResponse.json(
        {
          error: "免费预览次数已用完，请购买套餐查看完整报告",
          code: "PREVIEW_USED",
          preview: true,
        },
        { status: 403 }
      );
    }

    // 首次免费预览
    const analyzeMode = mode === "deep" ? "deep" : "basic";
    const startedAt = Date.now();
    const fullResult = await analyzeContract(text, { mode: analyzeMode });
    const elapsedMs = Date.now() - startedAt;
    const previewResult = buildPreview(fullResult);
    const risk = assessRisk(previewResult);

    const meta = {
      mode: analyzeMode,
      elapsedMs,
      clauseCount: fullResult.clauses.length,
    };

    await db
      .prepare(
        "INSERT OR REPLACE INTO user_previews (user_id, result, risk, meta, text_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(
        user.id,
        JSON.stringify(previewResult),
        JSON.stringify(risk),
        JSON.stringify(meta),
        textHash,
        now
      )
      .run();

    return NextResponse.json({
      result: previewResult,
      risk,
      credits: 0,
      preview: true,
      meta,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "分析失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
