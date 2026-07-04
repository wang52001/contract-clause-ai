"use client";

import { RiskScore } from "@/components/analyze/RiskScore";
import { ClauseList } from "@/components/analyze/ClauseList";
import { MissingAlerts } from "@/components/analyze/MissingAlerts";
import { ReportExport } from "@/components/report/ReportExport";
import { ShareButton } from "@/components/report/ShareButton";
import type { AnalysisResult } from "@/lib/ai/schema";
import type { RiskAssessment } from "@/lib/scoring/risk";

interface ReportViewProps {
  result: AnalysisResult;
  risk: RiskAssessment;
  isMember: boolean;
  meta?: { mode: string; elapsedMs: number; clauseCount: number } | null;
  showActions?: boolean;
}

export function ReportView({
  result,
  risk,
  isMember,
  meta,
  showActions = true,
}: ReportViewProps) {
  return (
    <div className="space-y-4">
      <RiskScore risk={risk} />

      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-slate-700">{result.overall.summary}</p>
        {result.overall.top_risks.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-xs font-medium text-slate-500">最严重的风险</div>
            <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-700">
              {result.overall.top_risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ClauseList result={result} isMember={isMember} />

      <MissingAlerts items={result.missing_protections} />

      {showActions && (
        <div className="flex flex-wrap gap-2 print:hidden">
          <ReportExport result={result} risk={risk} isMember={isMember} />
          <ShareButton result={result} risk={risk} />
        </div>
      )}

      {meta && (
        <p className="text-center text-xs text-muted-foreground">
          分析耗时 {(meta.elapsedMs / 1000).toFixed(1)}s · 共识别 {meta.clauseCount} 类条款
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground">
        本报告由 AI 生成，仅供参考，不构成法律意见。重大合同请咨询执业律师。
      </p>
    </div>
  );
}
