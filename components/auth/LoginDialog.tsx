"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Loader2, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginDialog({ open, onClose, onSuccess }: LoginDialogProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("email");
      setEmail("");
      setCode("");
      setInviteCode("");
      setError(null);
      setMessage(null);
      setCountdown(0);
    }
  }, [open]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendCode = useCallback(async () => {
    setError(null);
    setMessage(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请输入有效的邮箱地址");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error || "发送失败");
        return;
      }
      setStep("code");
      setCountdown(60);
      setMessage(data.message || "验证码已发送");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [email]);

  const verify = useCallback(async () => {
    setError(null);
    if (!code || code.length !== 6) {
      setError("请输入 6 位验证码");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, string> = { email, code };
      if (inviteCode.trim()) body.inviteCode = inviteCode.trim().toUpperCase();
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "验证失败");
        return;
      }
      onSuccess?.();
      onClose();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [code, email, onClose, onSuccess]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold">登录</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "email" ? "输入邮箱获取验证码" : `验证码已发送至 ${email}`}
        </p>

        {error && (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {message && !error && (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-2 text-sm text-green-700">
            {message}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {step === "email" ? (
            <>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="邀请码（选填）"
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                />
              </div>
              <Button onClick={sendCode} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "获取验证码"}
              </Button>
            </>
          ) : (
            <>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6 位验证码"
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm tracking-widest"
                  onKeyDown={(e) => e.key === "Enter" && verify()}
                />
              </div>
              <Button onClick={verify} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "登录"}
              </Button>
              <div className="flex justify-center">
                <button
                  onClick={sendCode}
                  disabled={countdown > 0 || loading}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {countdown > 0 ? `${countdown} 秒后重新发送` : "重新发送验证码"}
                </button>
              </div>
              <button
                onClick={() => setStep("email")}
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                使用其他邮箱
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
