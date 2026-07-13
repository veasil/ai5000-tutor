import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Level8Client } from "./Level8Client";

type Level8PageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function Level8Page({ params }: Level8PageProps) {
  const { journeyId } = await params;
  const journey = await prisma.journey.findUnique({
    where: { id: journeyId },
    select: {
      id: true,
      currentLevel: true,
      completedLevels: true,
      vision: true,
      demoPlan: true,
      effectVerification: true,
    },
  });

  if (!journey) notFound();

  const demoContext = [
    journey.vision,
    journey.demoPlan ? `Demo规划：${journey.demoPlan}` : null,
    journey.effectVerification ? `验证：${journey.effectVerification}` : null,
  ].filter(Boolean).join(" / ");

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px min(5vw, 56px)",
        background:
          "radial-gradient(circle at top left, #eadcff, transparent 32%), linear-gradient(135deg, #fcf9ff 0%, #f8efe0 100%)",
        color: "#302445",
        fontFamily: "Noto Sans SC, sans-serif",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1180 }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Level 8 · Creativity Power
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 12 }}>
          Demo工坊
        </h1>
        <p style={{ maxWidth: 780, lineHeight: 1.8 }}>
          现在把愿景变成可以打开、可以试用、可以被检查的最小 Demo。先不要追求大而全，
          只要证明一个关键流程真的跑起来。
        </p>
        <div style={{ margin: "18px 0", color: "#66547c" }}>
          当前关卡: {journey.currentLevel} · 已完成: {journey.completedLevels.join(", ") || "暂无"}
        </div>
        <Level8Client journeyId={journey.id} demoContext={demoContext || "第7关 Demo 蓝图"} />
      </div>
    </main>
  );
}
