import { AnalysisResultSchema, type AnalysisResult } from "./schema";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import { callDeepSeek, type DeepSeekMessage } from "./deepseek";

export interface AnalyzeOptions {
  mode?: "basic" | "deep";
  maxRetries?: number;
}

function stripJsonFence(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return s.trim();
}

function extractJsonObject(raw: string): string {
  const cleaned = stripJsonFence(raw);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("返回内容未找到 JSON 对象");
  }
  return cleaned.slice(start, end + 1);
}

export async function analyzeContract(
  contractText: string,
  options: AnalyzeOptions = {}
): Promise<AnalysisResult> {
  const mode = options.mode ?? "basic";
  const maxRetries = options.maxRetries ?? 1;

  const messages: DeepSeekMessage[] = [
    { role: "system", content: buildSystemPrompt(mode) },
    { role: "user", content: buildUserPrompt(contractText) },
  ];

  const model = mode === "deep" ? "deepseek-reasoner" : "deepseek-chat";

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const raw = await callDeepSeek(messages, {
        model,
        json: true,
        temperature: 0.2,
        maxTokens: 8000,
      });
      const jsonStr = extractJsonObject(raw);
      const parsed = JSON.parse(jsonStr);
      const result = AnalysisResultSchema.parse(parsed);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        messages.push({
          role: "assistant",
          content: "（上次输出格式错误，请严格按 JSON schema 重新输出，不要任何额外文字）",
        });
      }
    }
  }
  throw lastError ?? new Error("分析失败");
}
