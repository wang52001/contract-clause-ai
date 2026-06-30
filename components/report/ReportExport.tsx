"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/ai/schema";
import type { RiskAssessment } from "@/lib/scoring/risk";
import { CLAUSE_DEFS } from "@/lib/constants/clauses";

interface ReportExportProps {
  result: AnalysisResult;
  risk: RiskAssessment;
  isMember: boolean;
}

export function ReportExport({ result, risk, isMember }: ReportExportProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const lines: string[] = [];
    lines.push("===== 自由职业者合同审查报告 =====");
    lines.push("");
    lines.push(`整体风险评分：${risk.totalScore}/100（${risk.levelLabel}）`);
    lines.push(`总评：${result.overall.summary}`);
    lines.push("");
    lines.push("主要风险：");
    result.overall.top_risks.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`));
    lines.push("");
    lines.push("----- 条款分析 -----");
    result.clauses.forEach((c) => {
      const def = CLAUSE_DEFS[c.type];
      lines.push("");
      lines.push(`【${def.title}】风险等级：${c.severity}（${c.sub_score}/100）`);
      if (c.original_text) lines.push(`原文：${c.original_text}`);
      lines.push(`解读：${c.plain_explanation}`);
      if (c.risks.length) lines.push(`风险点：${c.risks.join("；")}`);
      if (isMember && c.suggested_revision) lines.push(`建议替换：${c.suggested_revision}`);
      if (isMember && c.negotiation_script) lines.push(`谈判话术：${c.negotiation_script}`);
    });
    if (result.missing_protections.length) {
      lines.push("");
      lines.push("----- 缺失保护条款 -----");
      result.missing_protections.forEach((m) => {
        lines.push(`【${CLAUSE_DEFS[m.type].title}】${m.why_needed}`);
        if (m.suggested_text) lines.push(`  建议补充：${m.suggested_text}`);
      });
    }
    lines.push("");
    lines.push("===== 本报告由 AI 生成，仅供参考，不构成法律意见 =====");

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "合同审查报告.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2 print:hidden">
      <Button onClick={handlePrint} variant="outline" size="sm">
        <Printer className="h-4 w-4" />
        打印 / 另存 PDF
      </Button>
      <Button onClick={handleDownloadTxt} variant="outline" size="sm">
        <Download className="h-4 w-4" />
        导出文本
      </Button>
    </div>
  );
}
