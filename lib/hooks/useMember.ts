"use client";

import { useState, useEffect, useCallback } from "react";

const LEGACY_KEY = "fcg_member_activated";
const VALID_CODES = ["FREELANCER2026", "JIEBAO2026", "EARLYBIRD2026"];

export interface MemberUser {
  id: number;
  email: string;
}

export function useMember() {
  const [isMember, setIsMember] = useState(false);
  const [user, setUser] = useState<MemberUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "same-origin",
      });
      const data = (await res.json()) as { user?: MemberUser | null; isMember?: boolean };
      setUser(data.user ?? null);
      setIsMember(data.isMember ?? false);
    } catch {
      setUser(null);
      setIsMember(false);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, code: string): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string; user?: MemberUser };
      if (!res.ok) {
        return { ok: false, message: data.error || "登录失败" };
      }
      setUser(data.user ?? null);
      await refresh();
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "登录失败";
      return { ok: false, message: msg };
    }
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      setUser(null);
      setIsMember(false);
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {}
    }
  }, []);

  const activate = useCallback(async (code: string): Promise<boolean> => {
    const ok = VALID_CODES.includes(code.trim().toUpperCase());
    if (!ok) return false;

    try {
      const res = await fetch("/api/membership/activate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
        credentials: "same-origin",
      });
      if (!res.ok) return false;
      await refresh();
      return true;
    } catch {
      return false;
    }
  }, [refresh]);

  const createOrder = useCallback(async (paymentMethod: "wxpay" | "alipay", note?: string) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod, note }),
      credentials: "same-origin",
    });
    const data = (await res.json()) as { error?: string; order?: { id: number; amount: number; status: string; paymentMethod: string; note: string; createdAt: number } };
    if (!res.ok) throw new Error(data.error || "创建订单失败");
    return data.order as {
      id: number;
      amount: number;
      status: string;
      paymentMethod: string;
      note: string;
      createdAt: number;
    };
  }, []);

  return {
    isMember,
    user,
    loaded,
    login,
    logout,
    activate,
    createOrder,
    refresh,
  };
}
