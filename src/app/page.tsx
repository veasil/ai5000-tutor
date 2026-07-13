import { StartMvpButton } from "./StartMvpButton";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px min(6vw, 72px)",
        background:
          "linear-gradient(135deg, #f5ead8 0%, #dbeee8 54%, #f8d89b 100%)",
        color: "#332316",
        fontFamily: "Noto Sans SC, sans-serif",
      }}
    >
      <div style={{ maxWidth: 880 }}>
        <p style={{ letterSpacing: "0.14em" }}>AI5000天 · MVP</p>
        <h1 style={{ fontSize: "clamp(40px, 7vw, 76px)", lineHeight: 1.02 }}>
          负责任开发者 AI Tutor
        </h1>
        <p style={{ fontSize: 20, lineHeight: 1.7 }}>
          Next.js 应用壳已接入早期状态机和数据库模型。第1关先嵌入 WQT
          卡牌系统，WQT 继续负责卡牌、计分和复盘，AI Tutor 负责保存旅程进度。
        </p>
        <StartMvpButton />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
          <a href="/journey/demo-journey/level/1">打开第1关 WQT 嵌入页</a>
          <a href="/api/health">查看 health API</a>
          <a href="https://veasil.github.io/ai5000-tutor/">打开静态原型</a>
        </div>
      </div>
    </main>
  );
}
