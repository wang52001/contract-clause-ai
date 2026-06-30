"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLAUSE_DEFS } from "@/lib/constants/clauses";
import type { MissingProtection } from "@/lib/ai/schema";

export function MissingAlerts({ items }: { items: MissingProtection[] }) {
  if (!items || items.length === 0) return null;
  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-purple-700">
          <AlertTriangle className="h-4 w-4" />
          缺失保护条款（{items.length}）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-purple-600">
          以下条款对自由职业者很重要，但合同中缺失，建议要求甲方补充。
        </p>
        {items.map((m, i) => {
          const def = CLAUSE_DEFS[m.type];
          return (
            <div key={i} className="rounded border border-purple-200 bg-white p-3">
              <div className="font-medium text-sm text-purple-700">
                {def?.title ?? m.type}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.why_needed}</p>
              {m.suggested_text && (
                <div className="mt-2 rounded bg-purple-50 p-2 text-xs text-slate-700">
                  建议补充：{m.suggested_text}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
