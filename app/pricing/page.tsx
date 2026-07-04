"use client";

import { useState } from "react";
import { Check, Sparkles, Lock, QrCode, LogIn, Loader2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMember } from "@/lib/hooks/useMember";
import { LoginDialog } from "@/components/auth/LoginDialog";

const PLANS = [
  { quantity: 1, amount: 990, label: "1 份", price: "¥9.9", badge: null },
  { quantity: 3, amount: 1990, label: "3 份", price: "¥19.9", badge: "省 ¥9.8" },
  { quantity: 5, amount: 2990, label: "5 份", price: "¥29.9", badge: "热门" },
  { quantity: 10, amount: 4990, label: "10 份", price: "¥49.9", badge: "最省" },
];

const FEATURES = [
  "全部 8 类条款详情",
  "修改建议（可替换文字）",
  "谈判话术（可直接发甲方）",
  "中国法律依据全文",
  "报告导出与分享",
  "深度分析（推理增强）",
];

export default function PricingPage() {
  const { credits, user, loaded, activate, createOrder } = useMember();
  const [loginOpen, setLoginOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<(typeof PLANS)[0] | null>(null);
  const [order, setOrder] = useState<{
    id: number;
    amount: number;
    quantity: number;
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
    if (!selectedPlan) return;
    setCreating(true);
    try {
      const newOrder = await createOrder(paymentMethod, selectedPlan.quantity, selectedPlan.amount, user?.email);
      setOrder(newOrder as {
        id: number;
        amount: number;
        quantity: number;
        paymentMethod: string;
        createdAt: number;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "创建订单失败";
      setCodeError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">选择分析次数套餐</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          登录后购买，支持跨设备同步。新用户注册即送 1 份免费分析次数。
        </p>
        {loaded && user && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            当前剩余：{credits} 份
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.quantity}
            onClick={() => !order && setSelectedPlan(plan)}
            className={`relative cursor-pointer rounded-lg border bg-card p-5 transition-all ${
              selectedPlan?.quantity === plan.quantity
                ? "border-primary ring-1 ring-primary"
                : "hover:border-primary/50"
            } ${order ? "opacity-60" : ""}`}
          >
            {plan.badge && (
              <div className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {plan.badge}
              </div>
            )}
            <div className="text-center">
              <div className="text-lg font-semibold">{plan.label}</div>
              <div className="mt-1 text-2xl font-bold">{plan.price}</div>
              <div className="text-xs text-muted-foreground">
                约 ¥{(plan.amount / plan.quantity / 100).toFixed(2)}/份
              </div>
            </div>
            {selectedPlan?.quantity === plan.quantity && (
              <div className="mt-3 text-center text-xs text-primary">已选择</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">套餐权益</h2>
          <p className="mt-1 text-sm text-muted-foreground">每次分析消耗 1 份</p>
          <ul className="mt-4 space-y-2 text-sm">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">下单支付</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedPlan
              ? `已选 ${selectedPlan.label}，共 ${selectedPlan.price}`
              : "请先选择上方套餐"}
          </p>

          {!loaded ? (
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
                  订单号：<span className="font-mono font-semibold">#{order.id}</span>
                  <br />
                  套餐：{order.quantity} 份 · 金额：¥{(order.amount / 100).toFixed(2)}
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
                onClick={() => {
                  setOrder(null);
                  setSelectedPlan(null);
                }}
              >
                重新选择套餐
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleCreateOrder("wxpay")}
                  disabled={creating || !selectedPlan}
                  variant="outline"
                  size="sm"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "微信支付"}
                </Button>
                <Button
                  onClick={() => handleCreateOrder("alipay")}
                  disabled={creating || !selectedPlan}
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
                <Gift className="mr-1 h-4 w-4" />
                激活邀请码
              </Button>
              {/*
                内测邀请码已结束
              */}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">说明</p>
        每份分析次数可审查一份合同。付款备注订单号，管理员确认后自动到账。分析次数用完可继续购买。
        本工具不替代律师，重大合同请咨询执业律师。
      </div>

      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
