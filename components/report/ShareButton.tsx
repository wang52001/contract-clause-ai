"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/ai/schema";
import type { RiskAssessment } from "@/lib/scoring/risk";
import { buildShareUrl } from "@/lib/share";

interface ShareButtonProps {
  result: AnalysisResult;
  risk: RiskAssessment;
}

export function ShareButton({ result, risk }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = buildShareUrl({ result, risk, createdAt: Date.now() });
    const text = `【合同审查报告】风险评分 ${risk.totalScore}/100（${risk.levelLabel}）—— 由「接单护身符」AI 生成`;

    const fallbackCopy = async () => {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    };

    try {
      if (navigator.share) {
        await navigator.share({ title: "合同审查报告", text, url });
      } else {
        await fallbackCopy();
      }
    } catch {
      await fallbackCopy();
    }
  };

  return (
    <Button onClick={handleShare} variant="outline" size="sm">
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? "链接已复制" : "分享报告"}
    </Button>
  );
}
