"use client";

import { useState } from "react";
import { Check, Sparkles, Lock, QrCode, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMember } from "@/lib/hooks/useMember";
import { LoginDialog } from "@/components/auth/LoginDialog";

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

export default function PricingPage() {
  const { isMember, user, loaded, activate, createOrder, refresh } = useMember();
  const [loginOpen, setLoginOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [order, setOrder] = useState<{
    id: number;
    amount: number;
    paymentMethod: string;
    createdAt: number;
  } | null>(null);
  const [creating, setCreating] = useState(false);

  const handleActivate = async () => {
    setCodeError(null);
    const ok = await activate(code);
    if (!ok) {
      setCodeError("邀请码无效，请检查后重试");
    }
  };

  const handleCreateOrder = async (paymentMethod: "wxpay" | "alipay") => {
    setCreating(true);
    try {
      const newOrder = await createOrder(paymentMethod, user?.email);
      setOrder(newOrder);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "创建订单失败";
      setCodeError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">选择适合你的方案</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          登录后购买会员，支持跨设备同步
        </p>
      </div>

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
            在线购买 ¥9.9/份
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {MEMBER_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {f}
              </li>
            ))}
          </ul>

          {!loaded ? (
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isMember ? (
            <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700">
              <Check className="mx-auto mb-1 h-5 w-5" />
              已激活会员权益
              {user && <div className="mt-1 text-xs opacity-80">{user.email}</div>}
            </div>
          ) : !user ? (
            <Button onClick={() => setLoginOpen(true)} className="mt-6 w-full">
              <LogIn className="mr-2 h-4 w-4" />
              登录后购买
            </Button>
          ) : order ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <QrCode className="h-4 w-4" />
                  订单已创建
                </div>
                <p className="text-xs leading-relaxed">
                  订单号：<span className="font-mono font-semibold">{order.id}</span>
                  <br />
                  扫码付款时<span className="font-semibold">务必备注订单号</span>，付款后我会尽快确认。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-center">
                  <div className="relative aspect-square overflow-hidden rounded-md bg-transparent">
                    <img
                      src="/wechat-pay.png"
                      alt="微信收款码"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">微信支付</p>
                </div>
                <div className="space-y-1 text-center">
                  <div className="relative aspect-square overflow-hidden rounded-md bg-transparent">
                    <img
                      src="/alipay-pay.png"
                      alt="支付宝收款码"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">支付宝</p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setOrder(null)}
              >
                重新选择支付方式
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <QrCode className="h-4 w-4" />
                  扫码购买 ¥9.9
                </div>
                <p className="text-xs leading-relaxed">
                  选择支付方式创建订单，扫码付款后我会手动确认。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleCreateOrder("wxpay")}
                  disabled={creating}
                  variant="outline"
                  size="sm"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "微信支付"}
                </Button>
                <Button
                  onClick={() => handleCreateOrder("alipay")}
                  disabled={creating}
                  variant="outline"
                  size="sm"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "支付宝"}
                </Button>
              </div>

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
              {codeError && <p className="text-xs text-destructive">{codeError}</p>}
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
        登录后购买会员，付款备注订单号，我确认后自动解锁。MVP 阶段也开放内测邀请码免费体验。
        单份报告 ¥9.9。本工具不替代律师，重大合同请咨询执业律师。
      </div>

      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
