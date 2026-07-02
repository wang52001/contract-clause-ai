"use client";

import Link from "next/link";
import { Loader2, ScanText, ShieldCheck, Sparkles, RotateCcw, AlertCircle } from "lucide-react";
import { useAnalysisStore } from "@/lib/store";
import { useMember } from "@/lib/hooks/useMember";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { TextPaste } from "@/components/upload/TextPaste";
import { Button } from "@/components/ui/button";
import { ReportView } from "@/components/report/ReportView";

export default function Home() {
  const text = useAnalysisStore((s) => s.text);
  const loading = useAnalysisStore((s) => s.loading);
  const error = useAnalysisStore((s) => s.error);
  const result = useAnalysisStore((s) => s.result);
  const risk = useAnalysisStore((s) => s.risk);
  const meta = useAnalysisStore((s) => s.meta);
  const analyze = useAnalysisStore((s) => s.analyze);
  const reset = useAnalysisStore((s) => s.reset);
  const { user, loaded, credits } = useMember();

  const hasCredits = credits > 0;

  if (result && risk) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <h1 className="text-xl font-bold">审查报告</h1>
          <div className="flex items-center gap-3">
            {loaded && user && (
              <span className="text-sm text-muted-foreground">
                剩余 {credits} 份
              </span>
            )}
            <Button onClick={reset} variant="ghost" size="sm" disabled={!hasCredits}>
              <RotateCcw className="h-4 w-4" />
              重新审查
            </Button>
          </div>
        </div>

        {!hasCredits && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            分析次数已用完，
            <Link href="/pricing" className="font-semibold underline">
              去购买套餐
            </Link>
          </div>
        )}

        <ReportView result={result} risk={risk} isMember={hasCredits} meta={meta} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          专为中国自由职业者打造
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          签合同前 30 秒
          <br />
          看清条款风险
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          AI 审查外包合同、NDA、合作协议，识别 8 类条款风险，给修改建议与谈判话术，引用中国法律。
          <br />
          文件在浏览器本地解析，不上传服务器。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {[
          { icon: ScanText, title: "8 类条款", desc: "付款/IP/竞业/NDA/kill fee" },
          { icon: Sparkles, title: "谈判话术", desc: "不只诊断，还教怎么谈" },
          { icon: ShieldCheck, title: "隐私优先", desc: "文件本地解析不上传" },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border bg-card p-3 text-center">
            <f.icon className="mx-auto mb-1 h-5 w-5 text-primary" />
            <div className="text-sm font-medium">{f.title}</div>
            <div className="text-xs text-muted-foreground">{f.desc}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">上传合同文件</h2>
          {loaded && user && (
            <span className="text-sm text-muted-foreground">剩余 {credits} 份</span>
          )}
        </div>
        <FileDropzone />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-2 text-xs text-muted-foreground">或粘贴文本</span>
          </div>
        </div>

        <TextPaste />

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            {error.includes("次数已用完") && (
              <Link href="/pricing">
                <Button size="sm" variant="outline">去购买</Button>
              </Link>
            )}
          </div>
        )}

        <Button
          onClick={() => analyze("basic")}
          disabled={loading || text.trim().length < 80 || !hasCredits}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              AI 正在审查…
            </>
          ) : !hasCredits && loaded && user ? (
            <>
              <ScanText className="h-4 w-4" />
              次数已用完
            </>
          ) : (
            <>
              <ScanText className="h-4 w-4" />
              开始审查
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {text.trim().length < 80
            ? `还需输入至少 ${80 - text.trim().length} 个字符`
            : !hasCredits && loaded && user
            ? "分析次数不足，请购买套餐"
            : "点击审查即同意本工具分析结果仅供参考"}
        </p>
      </div>
    </div>
  );
}
