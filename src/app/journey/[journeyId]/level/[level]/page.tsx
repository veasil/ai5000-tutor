import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LEVEL_CONFIGS } from "@/lib/journey/level-configs";

type LevelPlaceholderPageProps = {
  params: Promise<{ journeyId: string; level: string }>;
};

export default async function LevelPlaceholderPage({ params }: LevelPlaceholderPageProps) {
  const { journeyId, level } = await params;
  const levelNumber = Number(level);
  const config = LEVEL_CONFIGS[levelNumber];

  if (!config || levelNumber < 3 || levelNumber > 10) notFound();

  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    select: {
      id: true,
      currentLevel: true,
      completedLevels: true,
      selectedIssue: true,
      demoUrl: true,
      publishStatus: true,
    },
  });

  if (!journey) notFound();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px min(5vw, 56px)",
        background:
          "radial-gradient(circle at top left, #cde8ff, transparent 30%), linear-gradient(135deg, #f8efe0 0%, #edf4ec 100%)",
        color: "#332316",
        fontFamily: "Noto Sans SC, sans-serif",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 920 }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Level {config.level} · {config.power}
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 12 }}>
          {config.name}
        </h1>
        <p style={{ fontSize: 20, lineHeight: 1.8 }}>{config.description}</p>
        <section
          style={{
            marginTop: 28,
            border: "1px solid #d8c6a1",
            borderRadius: 24,
            padding: 24,
            background: "rgba(255, 250, 240, 0.86)",
          }}
        >
          <h2>当前 MVP 占位页</h2>
          <p style={{ lineHeight: 1.8 }}>
            前两关已经具备真实链路：WQT 卡牌复盘 -&gt; 状态机推进 -&gt; 责任议题锁定。
            第 {config.level} 关会继续围绕
            <strong>「{journey.selectedIssue || "已选择的责任议题"}」</strong>
            展开。下一步可以把这个占位页替换成该关真实交互。
          </p>
          <p>当前 Journey 关卡：{journey.currentLevel}</p>
          <p>已完成：{journey.completedLevels.join(", ") || "暂无"}</p>
          <p>发布状态：{journey.publishStatus}</p>
          <a href="/">回到 MVP 首页</a>
        </section>
      </div>
    </main>
  );
}
