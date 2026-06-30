import LZString from "lz-string";
import type { AnalysisResult } from "@/lib/ai/schema";
import type { RiskAssessment } from "@/lib/scoring/risk";

export interface SharedReport {
  result: AnalysisResult;
  risk: RiskAssessment;
  createdAt: number;
}

export function encodeReport(report: SharedReport): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(report));
}

export function decodeReport(encoded: string): SharedReport | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json) as SharedReport;
    if (!parsed?.result || !parsed?.risk) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildShareUrl(report: SharedReport): string {
  const encoded = encodeReport(report);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/report?d=${encoded}`;
}
