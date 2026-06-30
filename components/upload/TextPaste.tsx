"use client";

import { Textarea } from "@/components/ui/textarea";
import { useAnalysisStore } from "@/lib/store";

export function TextPaste() {
  const text = useAnalysisStore((s) => s.text);
  const setText = useAnalysisStore((s) => s.setText);

  return (
    <div className="space-y-1">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="或在此粘贴合同全文…&#10;&#10;提示：粘贴后点击下方“开始审查”按钮，AI 将识别 8 类条款风险。"
        className="min-h-[300px] font-mono text-xs leading-relaxed"
      />
      <div className="flex justify-end text-xs text-muted-foreground">
        {text.length} 字符
      </div>
    </div>
  );
}
