"use client";

import { Scale, AlertTriangle } from "lucide-react";
import type { LegalBasis } from "@/lib/ai/schema";
import { findLaw } from "@/lib/constants/laws";

export function LegalBasis({ basis }: { basis: LegalBasis[] }) {
  if (!basis || basis.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">未引用具体法条</p>
    );
  }
  return (
    <div className="space-y-1.5">
      {basis.map((b, i) => {
        const verified = findLaw(b.law, b.article);
        return (
          <div key={i} className="rounded border-l-2 border-slate-300 bg-slate-50 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1 font-medium text-slate-700">
              <Scale className="h-3 w-3" />
              《{b.law}》{b.article}
              {!verified && (
                <span className="ml-1 inline-flex items-center gap-0.5 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  待核验
                </span>
              )}
            </div>
            <p className="mt-0.5 text-slate-600">{verified?.text ?? b.text}</p>
          </div>
        );
      })}
    </div>
  );
}
