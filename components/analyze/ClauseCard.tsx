"use client";

import { Quote, Sparkles, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LegalBasis } from "./LegalBasis";
import { NegotiationTips } from "./NegotiationTips";
import { Paywall } from "@/components/Paywall";
import type { Clause, Severity } from "@/lib/ai/schema";
import { cn } from "@/lib/utils";

const SEVERITY_CONFIG: Record<
  Severity,
  { variant: "high" | "medium" | "low" | "missing"; label: string; border: string; bg: string; text: string }
> = {
  high: { variant: "high", label: "高风险", border: "border-red-200", bg: "bg-red-50", text: "text-red-700" },
  medium: { variant: "medium", label: "需关注", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700" },
  low: { variant: "low", label: "较公平", border: "border-green-200", bg: "bg-green-50", text: "text-green-700" },
  missing: { variant: "missing", label: "缺失", border: "border-purple-200", bg: "bg-purple-50", text: "text-purple-700" },
};

interface ClauseCardProps {
  clause: Clause;
  isMember: boolean;
  index: number;
}

export function ClauseCard({ clause, isMember, index }: ClauseCardProps) {
  const cfg = SEVERITY_CONFIG[clause.severity];
  const freeLocked = !isMember && index >= 3;

  return (
    <div className={cn("rounded-lg border p-4", cfg.border, cfg.bg)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800">{clause.title}</h3>
        <div className="flex items-center gap-2">
          {clause.confidence < 0.6 && (
            <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              待复核
            </span>
          )}
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          <span className={cn("text-xs font-mono", cfg.text)}>{clause.sub_score}</span>
        </div>
      </div>

      {freeLocked ? (
        <Paywall isMember={isMember} label={`第 ${index + 1} 类起为会员内容`}>
          <div className="mt-3 space-y-3" />
        </Paywall>
      ) : (
        <div className="mt-3 space-y-3">
          {clause.original_text && (
            <div>
              <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                <Quote className="h-3 w-3" />
                合同原文
              </div>
              <blockquote className="border-l-2 border-slate-300 bg-white/60 px-3 py-1.5 text-sm italic text-slate-600">
                {clause.original_text}
              </blockquote>
            </div>
          )}

          <div>
            <div className="mb-1 text-xs font-medium text-slate-500">大白话解读</div>
            <p className="text-sm text-slate-700">{clause.plain_explanation}</p>
          </div>

          {clause.risks.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">风险点</div>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-700">
                {clause.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {clause.suggested_revision && (
            <Paywall isMember={isMember} label="修改建议 · 会员可查看">
              <div className="rounded-md border border-green-200 bg-green-50 p-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  建议替换为
                </div>
                <p className="mt-1 text-sm text-slate-700">{clause.suggested_revision}</p>
              </div>
            </Paywall>
          )}

          <NegotiationTips script={clause.negotiation_script} isMember={isMember} />

          <div>
            <div className="mb-1 text-xs font-medium text-slate-500">法律依据</div>
            <LegalBasis basis={clause.legal_basis} />
          </div>
        </div>
      )}
    </div>
  );
}
