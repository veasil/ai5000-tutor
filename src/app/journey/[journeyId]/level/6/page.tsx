import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Level6Client } from "./Level6Client";

type Level6PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level6Page({ params }: Level6PageProps) {
  const { journeyId } = await params;
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    select: {
      id: true,
      currentLevel: true,
      completedLevels: true,
      mechanismDescription: true,
      aiCanDo: true,
      aiCannotDo: true,
    },
  });

  if (!journey) notFound();

  const mechanismContext = [
    journey.mechanismDescription,
    summarizeJsonArray("AI能做", journey.aiCanDo),
    summarizeJsonArray("AI不能做", journey.aiCannotDo),
  ].filter(Boolean).join(" / ");

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px min(5vw, 56px)",
        background:
          "radial-gradient(circle at top left, #d6f8e8, transparent 32%), linear-gradient(135deg, #f6fffa 0%, #f8efe0 100%)",
        color: "#1f3a30",
        fontFamily: "Noto Sans SC, sans-serif",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1180 }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Level 6 · Brainwave Power
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 12 }}>
          AI共创准备站
        </h1>
        <p style={{ maxWidth: 780, lineHeight: 1.8 }}>
          现在不是直接开做，而是先写清楚怎么和 AI 协作、怎么测试、怎么守住安全与伦理边界。
        </p>
        <div style={{ margin: "18px 0", color: "#496156" }}>
          当前关卡: {journey.currentLevel} · 已完成: {journey.completedLevels.join(", ") || "暂无"}
        </div>
        <Level6Client journeyId={journey.id} mechanismContext={mechanismContext || "上一关 AI 机制拆解"} />
      </div>
    </main>
  );
}

function summarizeJsonArray(label: string, value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return null;

  return `${label}：${value.map((item) => String(item)).slice(0, 3).join("、")}`;
}
