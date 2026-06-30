"use client";

import { create } from "zustand";
import type { AnalysisResult } from "@/lib/ai/schema";
import type { RiskAssessment } from "@/lib/scoring/risk";

interface AnalysisState {
  text: string;
  loading: boolean;
  error: string | null;
  result: AnalysisResult | null;
  risk: RiskAssessment | null;
  meta: { mode: string; elapsedMs: number; clauseCount: number } | null;
  setText: (t: string) => void;
  analyze: (mode?: "basic" | "deep") => Promise<void>;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  text: "",
  loading: false,
  error: null,
  result: null,
  risk: null,
  meta: null,
  setText: (t) => set({ text: t }),
  analyze: async (mode = "basic") => {
    const text = get().text.trim();
    if (text.length < 80) {
      set({ error: "合同文本过短，至少需要 80 个字符" });
      return;
    }
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "分析失败");
      set({
        result: data.result,
        risk: data.risk,
        meta: data.meta,
        loading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "分析失败",
        loading: false,
      });
    }
  },
  reset: () =>
    set({ text: "", result: null, risk: null, error: null, loading: false, meta: null }),
}));
