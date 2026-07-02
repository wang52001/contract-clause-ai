"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle, Shield, RefreshCw, MessageSquare, Send, Gift, Copy, Check } from "lucide-react";
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
  messageCount: number;
  lastMessageAt: number | null;
}

interface Message {
  id: number;
  role: "user" | "admin";
  content: string;
  createdAt: number;
  senderEmail: string;
}

interface InviteCode {
  id: number;
  code: string;
  orderId: number | null;
  usedBy: number | null;
  usedAt: number | null;
  createdAt: number;
  usedEmail: string | null;
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [storedSecret, setStoredSecret] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "codes">("orders");

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

  const fetchMessages = useCallback(async (orderId: number) => {
    if (!storedSecret) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        headers: { Authorization: `Bearer ${storedSecret}` },
      });
      const data = (await res.json()) as { error?: string; messages?: Message[] };
      if (res.ok) {
        setMessages(data.messages ?? []);
      }
    } catch {
      // ignore
    }
  }, [storedSecret]);

  const fetchInviteCodes = useCallback(async () => {
    if (!storedSecret) return;
    try {
      const res = await fetch("/api/admin/invite-codes", {
        headers: { Authorization: `Bearer ${storedSecret}` },
      });
      const data = (await res.json()) as { error?: string; codes?: InviteCode[] };
      if (res.ok) {
        setInviteCodes(data.codes ?? []);
      }
    } catch {
      // ignore
    }
  }, [storedSecret]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (activeTab === "codes") {
      fetchInviteCodes();
    }
  }, [activeTab, fetchInviteCodes]);

  useEffect(() => {
    if (selectedOrder) {
      fetchMessages(selectedOrder.id);
    }
  }, [selectedOrder, fetchMessages]);

  const handleLogin = () => {
    sessionStorage.setItem("fcg_admin_secret", secret);
    setStoredSecret(secret);
    setSecret("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("fcg_admin_secret");
    setStoredSecret(null);
    setOrders([]);
    setSelectedOrder(null);
  };

  const handleConfirm = async (orderId: number, sendCode: boolean) => {
    setConfirming(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sendInviteCode: sendCode }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean; inviteCode?: string };
      if (!res.ok) {
        setError(data.error || "确认失败");
        return;
      }
      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        fetchMessages(orderId);
      }
      if (data.inviteCode) {
        setCopiedCode(data.inviteCode);
        setTimeout(() => setCopiedCode(null), 3000);
      }
    } catch {
      setError("网络错误");
    } finally {
      setConfirming(null);
    }
  };

  const handleReply = async () => {
    if (!selectedOrder || !reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: reply.trim() }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error || "回复失败");
        return;
      }
      setReply("");
      await fetchMessages(selectedOrder.id);
      await fetchOrders();
    } catch {
      setError("网络错误");
    } finally {
      setSending(false);
    }
  };

  const handleGenerateCodes = async () => {
    if (!storedSecret) return;
    setGeneratingCodes(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count: 5 }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean; codes?: string[] };
      if (!res.ok) {
        setError(data.error || "生成失败");
        return;
      }
      await fetchInviteCodes();
    } catch {
      setError("网络错误");
    } finally {
      setGeneratingCodes(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatTime = (ts: number | null) => {
    if (!ts) return "-";
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
          <p className="mb-4 text-sm text-muted-foreground">输入管理员密钥查看订单与发放邀请码</p>
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold">管理后台</h1>
        <div className="flex items-center gap-2">
          <Button variant={activeTab === "orders" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("orders")}>
            订单
          </Button>
          <Button variant={activeTab === "codes" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("codes")}>
            邀请码
          </Button>
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

      {activeTab === "orders" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
                暂无订单
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    selectedOrder?.id === order.id ? "bg-accent" : "bg-card hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">#{order.id}</span>
                        <span className="text-muted-foreground">{order.email}</span>
                        {order.status === "pending" && (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">待付款</span>
                        )}
                        {order.status === "paid" && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">已付款</span>
                        )}
                      </div>
                      <div className="text-muted-foreground">
                        金额：¥{(order.amount / 100).toFixed(2)} · 方式：
                        {order.paymentMethod === "alipay" ? "支付宝" : order.paymentMethod === "wxpay" ? "微信" : order.paymentMethod}
                      </div>
                      <div className="text-xs text-muted-foreground">创建：{formatTime(order.createdAt)}</div>
                      {order.note && <div className="text-xs text-muted-foreground">备注：{order.note}</div>}
                    </div>
                    {order.messageCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {order.messageCount}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            {selectedOrder ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">订单 #{selectedOrder.id}</div>
                    <div className="text-sm text-muted-foreground">{selectedOrder.email}</div>
                  </div>
                  {selectedOrder.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConfirm(selectedOrder.id, false)}
                        disabled={confirming === selectedOrder.id}
                      >
                        {confirming === selectedOrder.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                        仅确认
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(selectedOrder.id, true)}
                        disabled={confirming === selectedOrder.id}
                      >
                        {confirming === selectedOrder.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="mr-1 h-4 w-4" />}
                        确认并发码
                      </Button>
                    </div>
                  )}
                </div>

                <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-md border bg-background p-3">
                  {messages.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">暂无对话</div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.role === "admin" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <div className="mb-1 text-xs opacity-70">{msg.role === "admin" ? "管理员" : msg.senderEmail}</div>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          <div className="mt-1 text-right text-[10px] opacity-60">{formatTime(msg.createdAt)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="输入回复..."
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleReply()}
                  />
                  <Button onClick={handleReply} disabled={sending || !reply.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">选择左侧订单查看详情与对话</div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">邀请码管理</h2>
            <Button onClick={handleGenerateCodes} disabled={generatingCodes}>
              {generatingCodes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="mr-1 h-4 w-4" />}
              生成 5 个邀请码
            </Button>
          </div>

          {inviteCodes.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">暂无邀请码</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {inviteCodes.map((code) => (
                <div key={code.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm font-semibold">{code.code}</div>
                    <div className="text-xs text-muted-foreground">
                      {code.usedAt ? `已使用 · ${code.usedEmail || ""}` : "未使用"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode(code.code)}
                    disabled={Boolean(code.usedAt)}
                  >
                    {copiedCode === code.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
