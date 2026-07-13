import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Level5Client } from "./Level5Client";

type Level5PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level5Page({ params }: Level5PageProps) {
  const { journeyId } = await params;
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    select: {
      id: true,
      currentLevel: true,
      completedLevels: true,
      selectedIssue: true,
      rootCauses: true,
      entryWindow: true,
    },
  });

  if (!journey) notFound();

  const issueContext = [
    journey.selectedIssue,
    journey.entryWindow ? `切入窗口：${journey.entryWindow}` : null,
    summarizeJsonArray("根源", journey.rootCauses),
  ].filter(Boolean).join(" / ");

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px min(5vw, 56px)",
        background:
          "radial-gradient(circle at top right, #cbe0ff, transparent 32%), linear-gradient(135deg, #edf5ff 0%, #f8efe0 100%)",
        color: "#1f2c3a",
        fontFamily: "Noto Sans SC, sans-serif",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1180 }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Level 5 · Brainwave Power
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 12 }}>
          AI机制拆解局
        </h1>
        <p style={{ maxWidth: 780, lineHeight: 1.8 }}>
          现在进入脑波力：不是急着让 AI 做东西，而是先弄懂 AI 在问题里可能怎样工作、
          能帮到哪里、边界又在哪里。
        </p>
        <div style={{ margin: "18px 0", color: "#4d5d70" }}>
          当前关卡: {journey.currentLevel} · 已完成: {journey.completedLevels.join(", ") || "暂无"}
        </div>
        <Level5Client journeyId={journey.id} issueContext={issueContext || "前面关卡的议题线索"} />
      </div>
    </main>
  );
}

function summarizeJsonArray(label: string, value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return null;

  return `${label}：${value.map((item) => String(item)).slice(0, 3).join("、")}`;
}
