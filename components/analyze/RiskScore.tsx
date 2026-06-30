"use client";

import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";
import type { RiskAssessment } from "@/lib/scoring/risk";
import { cn } from "@/lib/utils";

export function RiskScore({ risk }: { risk: RiskAssessment }) {
  const { totalScore, level, levelLabel } = risk;
  const isHigh = level === "high";
  const isMedium = level === "medium";

  const color = isHigh
    ? "text-risk-high"
    : isMedium
    ? "text-risk-medium"
    : "text-risk-low";
  const bg = isHigh
    ? "bg-red-50 border-red-200"
    : isMedium
    ? "bg-amber-50 border-amber-200"
    : "bg-green-50 border-green-200";

  const Icon = isHigh ? ShieldAlert : isMedium ? Shield : ShieldCheck;

  return (
    <div className={cn("flex items-center gap-6 rounded-lg border p-6", bg)}>
      <Icon className={cn("h-14 w-14 shrink-0", color)} />
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className={cn("text-5xl font-bold", color)}>{totalScore}</span>
          <span className="text-sm text-muted-foreground">/ 100 风险分</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          分数越高风险越大 · {levelLabel}
        </p>
      </div>
    </div>
  );
}
