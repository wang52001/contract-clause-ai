import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "自由职业者合同审查 · 接单护身符",
  description:
    "专为中国自由职业者打造的 AI 合同审查工具。上传外包合同、NDA、合作协议，AI 识别 8 类条款风险，给修改建议与谈判话术，引用中国法律依据。文件浏览器本地解析，不上传服务器。",
  keywords: ["合同审查", "自由职业者", "外包合同", "NDA", "知识产权", "AI法律工具"],
  authors: [{ name: "接单护身符" }],
  openGraph: {
    title: "自由职业者合同审查 · 接单护身符",
    description: "签合同前 30 秒看清条款风险，附修改建议与谈判话术。",
    type: "website",
    locale: "zh_CN",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
