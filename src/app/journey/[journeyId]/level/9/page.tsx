import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Level9Client } from "./Level9Client";

type Level9PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level9Page({ params }: Level9PageProps) {
  const { journeyId } = await params;
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    select: {
      id: true,
      currentLevel: true,
      completedLevels: true,
      selectedIssue: true,
      vision: true,
      demoUrl: true,
      responsibilityReview: true,
      publishStatus: true,
    },
  });

  if (!journey) notFound();

  const impactContext = [
    journey.selectedIssue ? `议题：${journey.selectedIssue}` : null,
    journey.vision ? `愿景：${journey.vision}` : null,
    journey.demoUrl ? `Demo：${journey.demoUrl}` : null,
    journey.responsibilityReview ? `责任审查：${journey.responsibilityReview}` : null,
  ].filter(Boolean).join(" / ");

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px min(5vw, 56px)",
        background:
          "radial-gradient(circle at 12% 14%, rgba(255, 207, 111, 0.46), transparent 28%), radial-gradient(circle at 86% 18%, rgba(88, 164, 176, 0.32), transparent 30%), linear-gradient(135deg, #fff8e7 0%, #eef7f5 100%)",
        color: "#233534",
        fontFamily: "Noto Sans SC, sans-serif",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1180 }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Level 9 · Communication Power
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 12 }}>
          影响力
        </h1>
        <p style={{ maxWidth: 800, lineHeight: 1.8 }}>
          作品已经能打开了。现在我们把它的真实帮助、传播方式和一句有记忆点的 slogan
          写清楚，同时生成 MVP 阶段的责任检查报告，把发布状态推进到审核中。
        </p>
        <div style={{ margin: "18px 0", color: "#58706d" }}>
          当前关卡: {journey.currentLevel} · 已完成: {journey.completedLevels.join(", ") || "暂无"} · 发布状态: {journey.publishStatus}
        </div>
        <Level9Client
          journeyId={journey.id}
          demoUrl={journey.demoUrl || ""}
          impactContext={impactContext || "第8关 Demo 与责任审查"}
        />
      </div>
    </main>
  );
}
