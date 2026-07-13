import type { ReactNode } from "react";

export const metadata = {
  title: "AI5000天 · 负责任开发者 AI Tutor",
  description: "闯关式 AI 创客训练系统",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
