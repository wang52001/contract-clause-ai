"use client";

import Link from "next/link";
import { ShieldCheck, LogOut, User, Loader2 } from "lucide-react";
import { useMember } from "@/lib/hooks/useMember";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, loaded, logout } = useMember();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span>接单护身符</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            首页
          </Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
            定价
          </Link>
          {loaded ? (
            user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/account"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <User className="h-3.5 w-3.5" />
                  {user.email}
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} className="h-8 px-2 text-xs">
                  <LogOut className="mr-1 h-3.5 w-3.5" />
                  退出
                </Button>
              </div>
            ) : (
              <Link href="/pricing">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  登录
                </Button>
              </Link>
            )
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </nav>
      </div>
    </header>
  );
}
