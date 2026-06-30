"use client";

import { MessageCircle } from "lucide-react";
import { Paywall } from "@/components/Paywall";

export function NegotiationTips({
  script,
  isMember,
}: {
  script: string | null;
  isMember: boolean;
}) {
  if (!script) return null;
  return (
    <Paywall isMember={isMember} label="谈判话术 · 会员可查看">
      <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-blue-700">
          <MessageCircle className="h-3.5 w-3.5" />
          谈判话术（可直接发给甲方）
        </div>
        <p className="mt-1.5 whitespace-pre-line text-sm text-slate-700">
          {script}
        </p>
      </div>
    </Paywall>
  );
}
