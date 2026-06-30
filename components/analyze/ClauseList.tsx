"use client";

import { ClauseCard } from "./ClauseCard";
import type { AnalysisResult } from "@/lib/ai/schema";

interface ClauseListProps {
  result: AnalysisResult;
  isMember: boolean;
}

export function ClauseList({ result, isMember }: ClauseListProps) {
  return (
    <div className="space-y-3">
      {result.clauses.map((c, i) => (
        <ClauseCard key={c.type} clause={c} isMember={isMember} index={i} />
      ))}
    </div>
  );
}
