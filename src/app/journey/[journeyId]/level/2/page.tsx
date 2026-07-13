import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Level2Client } from "./Level2Client";

type Level2PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level2Page({ params }: Level2PageProps) {
  const { journeyId } = await params;
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    select: {
      id: true,
      currentLevel: true,
      completedLevels: true,
      top3Concerns: true,
      wqtSessionId: true,
      selectedIssue: true,
    },
  });

  if (!journey) notFound();

  const concerns = normalizeConcerns(journey.top3Concerns);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px min(5vw, 56px)",
        background:
          "radial-gradient(circle at top right, #d8f0d7, transparent 30%), linear-gradient(135deg, #f8efe0 0%, #e6f2ef 100%)",
        color: "#332316",
        fontFamily: "Noto Sans SC, sans-serif",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1180 }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Level 2 · Safety Power
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 12 }}>
          责任议题锁定
        </h1>
        <p style={{ maxWidth: 760, lineHeight: 1.8 }}>
          第 1 关已经从 WQT 复盘中收敛出三个关注点。现在先锁定一个真正愿意继续做的责任议题，
          让后面的实感调研、机制拆解和 Demo 工坊都有一个清晰方向。
        </p>
        <div style={{ margin: "18px 0", color: "#5d4630" }}>
          WQT session: {journey.wqtSessionId || "尚未关联"} · 当前关卡: {journey.currentLevel}
        </div>
        <Level2Client journeyId={journey.id} concerns={concerns} />
      </div>
    </main>
  );
}

function normalizeConcerns(top3Concerns: string[]) {
  const concerns = top3Concerns.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  const fallbacks = ["身体安全", "心理安全", "社交安全"];

  for (const fallback of fallbacks) {
    if (concerns.length >= 3) break;
    if (!concerns.includes(fallback)) concerns.push(fallback);
  }

  return concerns;
}
