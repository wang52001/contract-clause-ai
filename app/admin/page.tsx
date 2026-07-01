"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Order {
  id: number;
  amount: number;
  status: string;
  paymentMethod: string;
  note: string;
  createdAt: number;
  paidAt: number | null;
  email: string;
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [storedSecret, setStoredSecret] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStoredSecret(sessionStorage.getItem("fcg_admin_secret"));
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!storedSecret) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${storedSecret}` },
      });
      const data = (await res.json()) as { error?: string; orders?: Order[] };
      if (!res.ok) {
        setError(data.error || "获取订单失败");
        return;
      }
      setOrders(data.orders ?? []);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, [storedSecret]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleLogin = () => {
    sessionStorage.setItem("fcg_admin_secret", secret);
    setStoredSecret(secret);
    setSecret("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("fcg_admin_secret");
    setStoredSecret(null);
    setOrders([]);
  };

  const handleConfirm = async (orderId: number) => {
    setConfirming(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${storedSecret}` },
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error || "确认失败");
        return;
      }
      await fetchOrders();
    } catch {
      setError("网络错误");
    } finally {
      setConfirming(null);
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString("zh-CN");
  };

  if (!storedSecret) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Shield className="h-5 w-5" />
            管理员登录
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            输入管理员密钥查看待确认订单
          </p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="ADMIN_SECRET"
            className="mb-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <Button onClick={handleLogin} className="w-full">
            进入后台
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">订单管理</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            退出
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          暂无待确认订单
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">#{order.id}</span>
                  <span className="text-muted-foreground">{order.email}</span>
                </div>
                <div className="text-muted-foreground">
                  金额：¥{(order.amount / 100).toFixed(2)} · 方式：
                  {order.paymentMethod === "alipay" ? "支付宝" : "微信"}
                </div>
                <div className="text-xs text-muted-foreground">
                  创建时间：{formatTime(order.createdAt)}
                </div>
                {order.note && (
                  <div className="text-xs text-muted-foreground">备注：{order.note}</div>
                )}
              </div>
              <Button
                onClick={() => handleConfirm(order.id)}
                disabled={confirming === order.id}
                size="sm"
              >
                {confirming === order.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-1 h-4 w-4" />
                )}
                确认收款
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
