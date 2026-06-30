"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Sparkles, Lock, Loader2, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMember } from "@/lib/hooks/useMember";

const FREE_FEATURES = [
  "8 类条款风险识别",
  "整体风险评分",
  "前 3 类条款详情解读",
  "缺失保护提示",
];

const MEMBER_FEATURES = [
  "全部 8 类条款详情",
  "修改建议（可替换文字）",
  "谈判话术（可直接发甲方）",
  "中国法律依据全文",
  "报告导出与分享",
  "深度分析（推理增强）",
];

type PayType = "alipay" | "wxpay";

export default function PricingPage() {
  const { isMember, activate, activatePaid } = useMember();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [paying, setPaying] = useState<PayType | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const paid = new URLSearchParams(window.location.search).get("paid");
    if (paid === "1") {
      activatePaid();
      setNotice("支付成功，会员权益已激活");
      window.history.replaceState({}, "", "/pricing");
    } else if (paid === "0") {
      setPayError("支付未完成或仍在处理中，可稍后刷新查看");
      window.history.replaceState({}, "", "/pricing");
    }
  }, [activatePaid]);

  const handleActivate = () => {
    setError(null);
    if (!activate(code)) {
      setError("邀请码无效，请检查后重试");
    }
  };

  const handlePay = useCallback(async (type: PayType) => {
    setPayError(null);
    setPaying(type);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!data.ok) {
        setPayError(data.message ?? "支付通道暂不可用，请使用邀请码激活");
        return;
      }
      window.location.href = data.url;
    } catch {
      setPayError("网络错误，请稍后重试");
    } finally {
      setPaying(null);
    }
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">选择适合你的方案</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          MVP 阶段会员通过邀请码激活，验证付费意愿
        </p>
      </div>

      {notice && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <Check className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">免费版</h2>
          <p className="mt-1 text-sm text-muted-foreground">基础审查，永久免费</p>
          <ul className="mt-4 space-y-2 text-sm">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="mt-6 w-full" disabled>
            当前方案
          </Button>
        </div>

        <div className="relative rounded-lg border-2 border-primary bg-card p-6">
          <div className="absolute -top-3 left-6 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            推荐
          </div>
          <h2 className="text-lg font-semibold">会员版</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            邀请码激活 · 在线购买 ¥9.9/份
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {MEMBER_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {f}
              </li>
            ))}
          </ul>

          {isMember ? (
            <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700">
              <Check className="mx-auto mb-1 h-5 w-5" />
              已激活会员权益
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handlePay("alipay")}
                  disabled={paying !== null}
                  variant="outline"
                  size="sm"
                >
                  {paying === "alipay" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  支付宝 ¥9.9
                </Button>
                <Button
                  onClick={() => handlePay("wxpay")}
                  disabled={paying !== null}
                  variant="outline"
                  size="sm"
                >
                  {paying === "wxpay" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  微信支付 ¥9.9
                </Button>
              </div>

              {payError && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {payError}
                </div>
              )}

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-2 text-xs text-muted-foreground">或使用邀请码</span>
                </div>
              </div>

              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="输入邀请码"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button onClick={handleActivate} className="w-full" size="sm">
                <Lock className="h-4 w-4" />
                激活会员
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                内测邀请码：FREELANCER2026
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">说明</p>
        MVP 阶段支付为骨架接入，未配置商户号时优先使用邀请码激活。正式上线后接入微信/支付宝，
        单份报告 ¥9.9，会员月卡 ¥29.9。本工具不替代律师，重大合同请咨询执业律师。
      </div>
    </div>
  );
}
