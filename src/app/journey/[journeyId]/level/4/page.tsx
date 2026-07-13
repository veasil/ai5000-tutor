import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Level4Client } from "./Level4Client";

type Level4PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level4Page({ params }: Level4PageProps) {
  const { journeyId } = await params;
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    select: {
      id: true,
      currentLevel: true,
      completedLevels: true,
      selectedIssue: true,
      protagonist: true,
      plot: true,
      evidence: true,
    },
  });

  if (!journey) notFound();

  const storySummary = [
    journey.selectedIssue,
    journey.protagonist ? `主角：${journey.protagonist}` : null,
    journey.plot,
    journey.evidence ? `证据：${journey.evidence}` : null,
  ].filter(Boolean).join(" / ");

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px min(5vw, 56px)",
        background:
          "radial-gradient(circle at top left, #ffe1a8, transparent 30%), linear-gradient(135deg, #f5ead8 0%, #f0efe7 100%)",
        color: "#332316",
        fontFamily: "Noto Sans SC, sans-serif",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1180 }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Level 4 · Sensing Power
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 12 }}>
          问题侦探局
        </h1>
        <p style={{ maxWidth: 780, lineHeight: 1.8 }}>
          真实故事只是露出水面的部分。现在我们像侦探一样拆开：谁被牵涉、根源在哪里、
          谁曾经试过，以及你最小可做的切入窗口是什么。
        </p>
        <div style={{ margin: "18px 0", color: "#5d4630" }}>
          当前关卡: {journey.currentLevel} · 已完成: {journey.completedLevels.join(", ") || "暂无"}
        </div>
        <Level4Client journeyId={journey.id} storySummary={storySummary || "上一关故事卡尚未填写"} />
      </div>
    </main>
  );
}
