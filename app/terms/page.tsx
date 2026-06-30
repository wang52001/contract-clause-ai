import { Scale, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "用户协议 · 接单护身符",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">用户协议</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        最后更新：2026 年 6 月 30 日
      </p>

      <div className="space-y-6 text-sm leading-relaxed text-slate-700">
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            重要声明
          </h2>
          <p>
            本工具提供的分析由人工智能生成，<strong>仅供参考，不构成法律意见或法律服务</strong>。
            本工具非律师事务所，不建立律师-客户关系。分析可能存在错误或遗漏，重大合同请咨询执业律师。
            使用者应自行判断并承担风险。
          </p>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Scale className="h-4 w-4 text-primary" />
            服务性质
          </h2>
          <p>
            「接单护身符」是一款基于人工智能的合同分析辅助工具，通过识别合同条款中的潜在风险点，
            帮助自由职业者理解合同内容。本工具不提供法律咨询、不代为起草法律文书、不代理诉讼，
            不构成《中华人民共和国律师法》所规定的法律服务。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">使用限制</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>不得将本工具用于非法目的</li>
            <li>不得滥用、逆向工程或攻击本服务</li>
            <li>不得批量爬取或自动化调用超出合理使用范围</li>
            <li>免费用户每日分析次数受限，会员权益通过邀请码或付费激活</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">免责声明</h2>
          <p>
            在适用法律允许的最大范围内，本工具对分析结果的准确性、完整性不作任何明示或暗示的保证。
            因使用本工具产生的任何直接或间接损失，本工具不承担责任。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">知识产权</h2>
          <p>
            本工具的软件、设计、文案版权归开发者所有。您上传的合同内容归您所有，本工具不主张所有权。
            本工具生成的分析报告您可自由使用。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">服务变更与终止</h2>
          <p>
            本工具保留随时修改、暂停或终止服务的权利。会员权益在服务期间有效。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">争议解决</h2>
          <p>
            因本协议产生的争议，双方应友好协商解决；协商不成的，提交开发者所在地有管辖权的人民法院诉讼解决。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900">协议更新</h2>
          <p>本协议可能不时更新，更新后继续使用本服务即视为同意修改后的协议。</p>
        </section>
      </div>
    </div>
  );
}
