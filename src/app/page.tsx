import { StartMvpButton } from "./StartMvpButton";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f8efe0" }}>
      <iframe
        src="/prototype/index.html"
        title="AI5000天完整静态首页原型"
        style={{
          width: "100%",
          minHeight: "100vh",
          border: 0,
          display: "block",
          background: "#f8efe0",
        }}
      />
      <aside
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          width: "min(360px, calc(100vw - 36px))",
          display: "grid",
          gap: 10,
          padding: 16,
          border: "3px solid #2f281f",
          borderRadius: 18,
          background: "rgba(255, 250, 239, 0.96)",
          boxShadow: "8px 8px 0 rgba(47, 40, 31, 0.25)",
          zIndex: 20,
          fontFamily: "Noto Sans SC, sans-serif",
          color: "#2f281f",
        }}
      >
        <strong>Next MVP 入口</strong>
        <span style={{ lineHeight: 1.5 }}>
          首页显示原始 HTML 原型。点这里会创建真实 Journey 并进入 WQT 第1关。
        </span>
        <StartMvpButton />
      </aside>
    </main>
  );
}
