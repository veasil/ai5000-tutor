import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Level7Client } from "./Level7Client";

type Level7PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level7Page({ params }: Level7PageProps) {
  const { journeyId } = await params;
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    select: {
      id: true,
      currentLevel: true,
      completedLevels: true,
      collaborationChecklist: true,
      safetyItems: true,
      ethicsItems: true,
      selectedIssue: true,
      entryWindow: true,
    },
  });

  if (!journey) notFound();

  const prepContext = [
    journey.selectedIssue,
    journey.entryWindow ? `切入窗口：${journey.entryWindow}` : null,
    summarizeJsonArray("协作", journey.collaborationChecklist),
    summarizeJsonArray("安全", journey.safetyItems),
    summarizeJsonArray("伦理", journey.ethicsItems),
  ].filter(Boolean).join(" / ");

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px min(5vw, 56px)",
        background:
          "radial-gradient(circle at top right, #ffe2aa, transparent 32%), linear-gradient(135deg, #fff8ec 0%, #eef7f2 100%)",
        color: "#3b2a17",
        fontFamily: "Noto Sans SC, sans-serif",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1180 }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Level 7 · Creativity Power
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 12 }}>
          愿景与方法站
        </h1>
        <p style={{ maxWidth: 780, lineHeight: 1.8 }}>
          现在进入创心力：把前面的真实问题、AI 机制和共创清单，压成一个愿景和一个能开工的 Demo 规划。
        </p>
        <div style={{ margin: "18px 0", color: "#6b563a" }}>
          当前关卡: {journey.currentLevel} · 已完成: {journey.completedLevels.join(", ") || "暂无"}
        </div>
        <Level7Client journeyId={journey.id} prepContext={prepContext || "前面关卡的共创准备"} />
      </div>
    </main>
  );
}

function summarizeJsonArray(label: string, value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return null;

  return `${label}：${value.map((item) => String(item)).slice(0, 2).join("、")}`;
}
