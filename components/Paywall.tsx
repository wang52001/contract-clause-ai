"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaywallProps {
  children: React.ReactNode;
  isMember: boolean;
  label?: string;
}

export function Paywall({ children, isMember, label = "会员内容" }: PaywallProps) {
  if (isMember) return <>{children}</>;
  return (
    <div className="relative overflow-hidden rounded-md">
      <div className="pointer-events-none select-none opacity-40 blur-[3px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40">
        <Lock className="h-5 w-5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Button asChild size="sm" variant="outline">
          <Link href="/pricing">解锁会员</Link>
        </Button>
      </div>
    </div>
  );
}
