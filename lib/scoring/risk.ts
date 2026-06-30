import type { AnalysisResult, ClauseType } from "@/lib/ai/schema";
import { CLAUSE_DEFS, TOTAL_WEIGHT } from "@/lib/constants/clauses";

export type RiskLevel = "low" | "medium" | "high";

export interface ClauseContribution {
  type: ClauseType;
  title: string;
  subScore: number;
  weight: number;
  contribution: number;
}

export interface RiskAssessment {
  totalScore: number;
  level: RiskLevel;
  levelLabel: string;
  perClause: ClauseContribution[];
}

export function levelFromScore(score: number): RiskLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function levelLabel(level: RiskLevel): string {
  if (level === "high") return "高风险";
  if (level === "medium") return "需关注";
  return "低风险";
}

export function levelColor(level: RiskLevel): string {
  if (level === "high") return "text-risk-high";
  if (level === "medium") return "text-risk-medium";
  return "text-risk-low";
}

export function assessRisk(result: AnalysisResult): RiskAssessment {
  let total = 0;
  const perClause: ClauseContribution[] = result.clauses.map((c) => {
    const def = CLAUSE_DEFS[c.type];
    const normalizedWeight = def.weight / TOTAL_WEIGHT;
    const contribution = c.sub_score * normalizedWeight;
    total += contribution;
    return {
      type: c.type,
      title: def.title,
      subScore: c.sub_score,
      weight: def.weight,
      contribution,
    };
  });

  const rounded = Math.round(total);
  const level = levelFromScore(rounded);
  return {
    totalScore: rounded,
    level,
    levelLabel: levelLabel(level),
    perClause,
  };
}
