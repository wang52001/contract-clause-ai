import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">法律免责声明</p>
        <p className="mb-3 leading-relaxed">
          本工具提供的分析由人工智能生成，仅供参考，不构成法律意见或法律服务。本工具非律师事务所，不建立律师-客户关系。分析可能存在错误或遗漏，重大合同请咨询执业律师。使用者应自行判断并承担风险。
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/privacy" className="hover:text-foreground">
            隐私政策
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            用户协议
          </Link>
          <span>© {new Date().getFullYear()} 接单护身符</span>
        </div>
      </div>
    </footer>
  );
}
