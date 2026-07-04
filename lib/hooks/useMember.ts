"use client";

import { useState, useEffect, useCallback } from "react";

const LEGACY_KEY = "fcg_member_activated";

export interface MemberUser {
  id: number;
  email: string;
}

export function useMember() {
  const [isMember, setIsMember] = useState(false);
  const [credits, setCredits] = useState(0);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCount, setInviteCount] = useState(0);
  const [user, setUser] = useState<MemberUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        user?: MemberUser | null;
        isMember?: boolean;
        credits?: number;
        inviteCode?: string | null;
        inviteCount?: number;
      };
      setUser(data.user ?? null);
      setIsMember(data.isMember ?? false);
      setCredits(data.credits ?? 0);
      setInviteCode(data.inviteCode ?? null);
      setInviteCount(data.inviteCount ?? 0);
    } catch {
      setUser(null);
      setIsMember(false);
      setCredits(0);
      setInviteCode(null);
      setInviteCount(0);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, code: string, referralCode?: string): Promise<{ ok: boolean; message?: string }> => {
      try {
        const body: Record<string, string> = { email, code };
        if (referralCode) body.inviteCode = referralCode;

        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      setUser(null);
      setIsMember(false);
      setCredits(0);
      setInviteCode(null);
      setInviteCount(0);
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {}
    }
  }, []);

  const activate = useCallback(async (): Promise<boolean> => {
    return false;
  }, []);

  const createOrder = useCallback(
    async (paymentMethod: "wxpay" | "alipay", quantity = 1, amount = 990, note?: string) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod, quantity, amount, note }),
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        error?: string;
        order?: {
          id: number;
          amount: number;
          quantity: number;
          status: string;
          paymentMethod: string;
          note: string;
          createdAt: number;
        };
      };
      if (!res.ok) throw new Error(data.error || "创建订单失败");
      return data.order as {
        id: number;
        amount: number;
        quantity: number;
        status: string;
        paymentMethod: string;
        note: string;
        createdAt: number;
      };
    },
    []
  );

  return {
    isMember,
    credits,
    inviteCode,
    inviteCount,
    user,
    loaded,
    login,
    logout,
    activate,
    createOrder,
    refresh,
  };
}
