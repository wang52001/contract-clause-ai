"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MessageSquare,
  Bell,
  Crown,
  ArrowLeft,
  Send,
  User,
  CreditCard,
  Clock,
  CheckCircle,
  Copy,
  Check,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMember } from "@/lib/hooks/useMember";

interface Order {
  id: number;
  amount: number;
  status: string;
  paymentMethod: string;
  note: string;
  createdAt: number;
  paidAt: number | null;
}

interface Message {
  id: number;
  role: "user" | "admin";
  content: string;
  createdAt: number;
  senderEmail: string;
}

export default function AccountPage() {
  const { user, loaded, credits, inviteCode, inviteCount } = useMember();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [reminding, setReminding] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", { credentials: "same-origin" });
      const data = (await res.json()) as { error?: string; orders?: Order[] };
      if (!res.ok) throw new Error(data.error || "获取订单失败");
      setOrders(data.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取订单失败");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchMessages = useCallback(async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string; messages?: Message[] };
      if (res.ok) setMessages(data.messages ?? []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (loaded && !user) {
      router.replace("/pricing");
    } else if (loaded && user) {
      fetchOrders();
    }
  }, [loaded, user, router, fetchOrders]);

  useEffect(() => {
    if (selectedOrder) {
      fetchMessages(selectedOrder.id);
    } else {
      setMessages([]);
    }
  }, [selectedOrder, fetchMessages]);

  const handleRemind = async (orderId: number) => {
    setReminding(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/remind`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "催促失败");
      await fetchMessages(orderId);
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "催促失败");
    } finally {
      setReminding(null);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedOrder || !reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim() }),
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "发送失败");
      setReply("");
      await fetchMessages(selectedOrder.id);
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: number | null) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleString("zh-CN");
  };

  if (!loaded || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          首页
        </Link>
        <span>/</span>
        <span className="text-foreground">我的账户</span>
      </div>

      <div className="mb-6 rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold">{user.email}</div>
              <div className="text-xs text-muted-foreground">
                {credits > 0 ? "分析次数已解锁" : "登录账户"}
              </div>
            </div>
          </div>
          <div>
            {credits > 0 ? (
              <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800">
                <Crown className="h-4 w-4" />
                剩余 {credits} 份
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                暂无次数
              </div>
            )}
          </div>
        </div>

        {inviteCode && (
          <div className="mt-4 rounded-md border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              邀请好友
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md bg-background px-3 py-2 font-mono text-sm">
                {inviteCode}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(inviteCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              好友注册时填写你的邀请码，满 3 人可获赠 1 份（已邀请 {inviteCount}/3 人）
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">我的订单</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={loadingOrders}
            >
              <Loader2
                className={`mr-1 h-4 w-4 ${loadingOrders ? "animate-spin" : ""}`}
              />
              刷新
            </Button>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
              <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-50" />
              暂无订单
              <div className="mt-2">
                <Link href="/pricing">
                  <Button size="sm">去购买会员</Button>
                </Link>
              </div>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  selectedOrder?.id === order.id
                    ? "bg-accent"
                    : "bg-card hover:bg-accent/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">
                        #{order.id}
                      </span>
                      {order.status === "pending" && (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                          待付款
                        </span>
                      )}
                      {order.status === "paid" && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                          已完成
                        </span>
                      )}
                      {order.status === "cancelled" && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
                          已取消
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      金额：¥{(order.amount / 100).toFixed(2)} · 方式：
                      {order.paymentMethod === "alipay"
                        ? "支付宝"
                        : order.paymentMethod === "wxpay"
                        ? "微信"
                        : order.paymentMethod === "invite"
                        ? "邀请码"
                        : order.paymentMethod}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      创建：{formatTime(order.createdAt)}
                    </div>
                    {order.note && (
                      <div className="text-xs text-muted-foreground">
                        备注：{order.note}
                      </div>
                    )}
                  </div>
                  {order.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemind(order.id);
                      }}
                      disabled={reminding === order.id}
                    >
                      {reminding === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bell className="mr-1 h-3.5 w-3.5" />
                      )}
                      催一催
                    </Button>
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
                  <div className="text-sm text-muted-foreground">
                    {selectedOrder.status === "paid" ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                        已完成
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Clock className="h-3.5 w-3.5" />
                        待处理
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  返回
                </Button>
              </div>

              <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-md border bg-background p-3">
                {messages.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-50" />
                    暂无对话，点击下方输入框联系管理员
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === "admin" ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          msg.role === "admin"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <div className="mb-1 text-xs opacity-70">
                          {msg.role === "admin" ? "管理员" : "我"}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        <div className="mt-1 text-right text-[10px] opacity-60">
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="输入消息联系管理员..."
                  className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSendMessage()
                  }
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !reply.trim()}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center text-sm text-muted-foreground">
              <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
              选择一个订单查看对话
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
