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
    if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
      console.log(`[EMAIL to ${email}] ${subject}\n${body}`);
      return { ok: true, message: "邮件配置缺失，验证码已输出到控制台" };
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
        return { ok: false, message: data?.message || "邮件发送失败" };
      }

      return { ok: true, message: "验证码已发送" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "邮件发送异常";
      return { ok: false, message: msg };
    }
  }

  console.log(`[EMAIL to ${email}] ${subject}\n${body}`);
  return { ok: true, message: "未知邮件服务商，验证码已输出到控制台" };
}
