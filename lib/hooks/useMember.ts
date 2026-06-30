"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "fcg_member_activated";
const VALID_CODES = ["FREELANCER2026", "JIEBAO2026", "EARLYBIRD2026"];

export function useMember() {
  const [isMember, setIsMember] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setIsMember(true);
      }
    } catch {}
    setLoaded(true);
  }, []);

  const persist = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setIsMember(true);
  }, []);

  const activate = useCallback(
    (code: string): boolean => {
      const ok = VALID_CODES.includes(code.trim().toUpperCase());
      if (ok) persist();
      return ok;
    },
    [persist]
  );

  const activatePaid = useCallback(() => {
    persist();
  }, [persist]);

  return { isMember, loaded, activate, activatePaid };
}
