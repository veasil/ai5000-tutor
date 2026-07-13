import { Level1WqtEmbed } from "./Level1WqtEmbed";

type Level1PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level1Page({ params }: Level1PageProps) {
  const { journeyId } = await params;
  const wqtUrl =
    process.env.NEXT_PUBLIC_WQT_LEVEL1_URL ||
    process.env.NEXT_PUBLIC_WQT_BASE_URL ||
    "https://wqt-auth-backend.zeabur.app/";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px min(5vw, 56px)",
        background:
          "radial-gradient(circle at top left, #ffe1a8, transparent 32%), linear-gradient(135deg, #f8efe0 0%, #e6f2ef 100%)",
        fontFamily: "Noto Sans SC, sans-serif",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1180 }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          AI5000天 MVP
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 12 }}>
          小伍风险冒险局
        </h1>
        <p style={{ maxWidth: 720, lineHeight: 1.8 }}>
          这一关直接嵌入 WQT 已部署的卡牌系统。WQT 负责卡牌选择记录、
          计分反馈和复盘网页，AI Tutor 负责保存 WQT session 引用并推进十关旅程。
        </p>
        <Level1WqtEmbed journeyId={journeyId} wqtUrl={wqtUrl} />
      </div>
    </main>
  );
}
