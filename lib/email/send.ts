import { getEnv } from "@/lib/db/d1";

export async function sendVerificationEmail(email: string, code: string): Promise<{ ok: boolean; message: string }> {
  const env = getEnv();
  const provider = env.EMAIL_PROVIDER || "resend";

  const subject = "【接单护身符】登录验证码";
  const body = `你的登录验证码是：${code}\n\n10 分钟内有效。如非本人操作，请忽略本邮件。`;

  if (provider === "console") {
    console.log(`[EMAIL to ${email}] ${subject}\n${body}`);
    return { ok: true, message: "验证码已输出到控制台" };
  }

  if (provider === "resend") {
    if (!env.RESEND_API_KEY) {
      return { ok: false, message: "环境变量 RESEND_API_KEY 未配置" };
    }
    if (!env.FROM_EMAIL) {
      return { ok: false, message: "环境变量 FROM_EMAIL 未配置" };
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL,
          to: email,
          subject,
          text: body,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        return { ok: false, message: `Resend 错误: ${data?.message || res.statusText}` };
      }

      return { ok: true, message: "验证码已发送" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "邮件发送异常";
      return { ok: false, message: `请求异常: ${msg}` };
    }
  }

  return { ok: false, message: `未知的邮件服务商: ${provider}` };
}
