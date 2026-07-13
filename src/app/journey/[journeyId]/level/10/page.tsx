import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Level10Client } from "./Level10Client";

type Level10PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level10Page({ params }: Level10PageProps) {
  const { journeyId } = await params;
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    select: {
      id: true,
      currentLevel: true,
      completedLevels: true,
      selectedIssue: true,
      demoUrl: true,
      realImpact: true,
      slogan: true,
      publishStatus: true,
      workCardGenerated: true,
      parentConfirm: true,
      work: {
        select: {
          id: true,
          title: true,
          publishStatus: true,
        },
      },
      badge: {
        select: {
          id: true,
          type: true,
        },
      },
    },
  });

  if (!journey) notFound();

  const publishContext = [
    journey.selectedIssue ? `议题：${journey.selectedIssue}` : null,
    journey.realImpact ? `真实影响：${journey.realImpact}` : null,
    journey.slogan ? `slogan：${journey.slogan}` : null,
    journey.demoUrl ? `Demo：${journey.demoUrl}` : null,
  ].filter(Boolean).join(" / ");

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px min(5vw, 56px)",
        background:
          "radial-gradient(circle at 18% 12%, rgba(255, 127, 80, 0.28), transparent 28%), radial-gradient(circle at 85% 20%, rgba(45, 95, 141, 0.26), transparent 30%), linear-gradient(135deg, #fff6ef 0%, #edf3fb 100%)",
        color: "#2b3340",
        fontFamily: "Noto Sans SC, sans-serif",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1180 }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Level 10 · Communication Power
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 12 }}>
          小伍创客发布会
        </h1>
        <p style={{ maxWidth: 820, lineHeight: 1.8 }}>
          最后一关，把作品讲给世界听。MVP 会生成一张可审核的作品卡，点亮负责任开发者徽章，
          并把发布状态推进到已通过。
        </p>
        <div style={{ margin: "18px 0", color: "#5c6675" }}>
          当前关卡: {journey.currentLevel} · 已完成: {journey.completedLevels.join(", ") || "暂无"} · 发布状态: {journey.publishStatus}
        </div>
        {journey.work || journey.badge ? (
          <section style={summaryStyle}>
            <strong>MVP 发布结果：</strong>
            {journey.work ? `作品卡「${journey.work.title}」(${journey.work.publishStatus}) ` : ""}
            {journey.badge ? `徽章「${journey.badge.type}」已点亮` : ""}
          </section>
        ) : null}
        <Level10Client
          journeyId={journey.id}
          demoUrl={journey.demoUrl || ""}
          slogan={journey.slogan || ""}
          publishContext={publishContext || "第8关 Demo 与第9关影响力方案"}
        />
      </div>
    </main>
  );
}

const summaryStyle = {
  border: "1px solid #d9b58e",
  borderRadius: 18,
  padding: 18,
  marginBottom: 20,
  background: "rgba(255, 249, 239, 0.9)",
  lineHeight: 1.7,
} as const;
