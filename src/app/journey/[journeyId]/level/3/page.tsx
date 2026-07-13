import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Level3Client } from "./Level3Client";

type Level3PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level3Page({ params }: Level3PageProps) {
  const { journeyId } = await params;
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    select: {
      id: true,
      currentLevel: true,
      completedLevels: true,
      selectedIssue: true,
      protagonist: true,
    },
  });

  if (!journey) notFound();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px min(5vw, 56px)",
        background:
          "radial-gradient(circle at top right, #cde8ff, transparent 32%), linear-gradient(135deg, #f4ecd8 0%, #e7f0f5 100%)",
        color: "#332316",
        fontFamily: "Noto Sans SC, sans-serif",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1180 }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Level 3 · Sensing Power
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 12 }}>
          实感力启动
        </h1>
        <p style={{ maxWidth: 780, lineHeight: 1.8 }}>
          责任议题不能只停在“我觉得”。这一关要把它放回一个真实的人和真实场景里，
          形成后续问题侦探局会继续拆解的实感故事卡。
        </p>
        <div style={{ margin: "18px 0", color: "#5d4630" }}>
          当前关卡: {journey.currentLevel} · 已完成: {journey.completedLevels.join(", ") || "暂无"}
        </div>
        <Level3Client
          journeyId={journey.id}
          selectedIssue={journey.selectedIssue || "还没有锁定议题"}
        />
      </div>
    </main>
  );
}
