"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportView } from "@/components/report/ReportView";
import { decodeReport, type SharedReport } from "@/lib/share";
import { useMember } from "@/lib/hooks/useMember";

function ReportContent() {
  const searchParams = useSearchParams();
  const d = searchParams.get("d");
  const { isMember } = useMember();
  const [report, setReport] = useState<SharedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!d) {
      setError("分享链接缺少报告数据");
      return;
    }
    const decoded = decodeReport(d);
    if (!decoded) {
      setError("分享链接已损坏或失效");
      return;
    }
    setReport(decoded);
  }, [d]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
        <h1 className="mb-2 text-xl font-bold">无法打开报告</h1>
        <p className="mb-6 text-sm text-muted-foreground">{error}</p>
        <Button asChild>
          <Link href="/">
            <RotateCcw className="h-4 w-4" />
            返回首页审查
          </Link>
        </Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-muted-foreground">
        正在加载报告…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold">合同审查报告</h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <RotateCcw className="h-4 w-4" />
            我也要审查
          </Link>
        </Button>
      </div>
      <ReportView
        result={report.result}
        risk={report.risk}
        isMember={isMember}
        showActions={false}
      />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        分享自「接单护身符」· {new Date(report.createdAt).toLocaleString("zh-CN")}
      </p>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-muted-foreground">
          正在加载…
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
