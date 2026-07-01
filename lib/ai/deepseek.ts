export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
}

const API_URL = "https://api.deepseek.com/chat/completions";

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  options: DeepSeekOptions = {}
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  const body: Record<string, unknown> = {
    model: options.model ?? "deepseek-chat",
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 6000,
    stream: false,
  };

  if (options.json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`DeepSeek API 错误 ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("DeepSeek 返回内容为空");
  }
  return content;
}
