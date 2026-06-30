import { ShieldCheck, FileText, Database, Cookie } from "lucide-react";

export const metadata = {
  title: "隐私政策 · 接单护身符",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">隐私政策</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        最后更新：2026 年 6 月 30 日
      </p>

      <div className="space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-primary" />
            核心承诺：您的合同文件不离开浏览器
          </h2>
          <p>
            本工具采用「浏览器本地解析」架构。您上传的 PDF / Word 文件在您的浏览器内被解析为纯文本，
            <strong>原始文件不会上传到我们的服务器</strong>。只有从文件中提取的纯文本会发送至服务端用于 AI 分析，
            分析完成后<strong>不存储</strong>该文本（除非您主动点击「生成分享链接」，此时报告内容经压缩编码后存于链接本身，您可随时删除）。
          </p>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-900">
            <FileText className="h-4 w-4 text-primary" />
            数据流说明
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>合同文件 → 浏览器本地解析（pdfjs / mammoth）→ 提取纯文本</li>
            <li>纯文本 → 服务端 API → DeepSeek API（用于分析）→ 返回结构化结果</li>
            <li>分析结果 → 展示给您 → 默认不存储</li>
            <li>分享链接 → 报告数据经 LZ-string 压缩编码后嵌入 URL，无服务端数据库</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Database className="h-4 w-4 text-primary" />
            第三方服务
          </h2>
          <p>
            本工具调用 DeepSeek API 进行合同分析。您发送的合同文本会经 DeepSeek 处理。
            请参阅{" "}
            <a
              href="https://platform.deepseek.com/"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              DeepSeek 隐私政策
            </a>
            。DeepSeek 默认不将 API 数据用于模型训练（以官方政策为准）。
          </p>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Cookie className="h-4 w-4 text-primary" />
            本地存储使用
          </h2>
          <p>
            本工具使用 localStorage 存储：
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>会员激活状态（邀请码验证后标记）</li>
          </ul>
          <p>
            不使用追踪 Cookie，不收集身份信息。您可以随时在浏览器中清除本地存储。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">日志与埋点</h2>
          <p>
            服务端仅记录脱敏指标（分析次数、错误率、响应时长），<strong>不记录合同内容</strong>。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">未成年人</h2>
          <p>本工具面向 18 岁及以上用户。</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">联系我们</h2>
          <p>如对本隐私政策有疑问，可通过 GitHub Issues 联系。</p>
        </section>
      </div>
    </div>
  );
}
