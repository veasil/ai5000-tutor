import { prisma } from "@/lib/db";
import {
  buildLevel10Output,
  Level10CompleteRequestSchema,
  upsertPublishedWorkCard,
} from "@/lib/journey/level10";
import {
  advanceLevel,
  saveLevelOutput,
  transitionPublishStatus,
} from "@/lib/journey/state-machine";

type Level10RouteContext = {
  params: Promise<{ journeyId: string }>;
};

export async function POST(request: Request, context: Level10RouteContext) {
  const { journeyId } = await context.params;

  let body;
  try {
    body = Level10CompleteRequestSchema.parse(await request.json());
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "请求体格式不正确",
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  try {
    const journey = await prisma.journey.findUniqueOrThrow({
      where: { id: journeyId },
      select: {
        id: true,
        completedLevels: true,
        publishStatus: true,
      },
    });

    const output = buildLevel10Output(body);
    const updatedJourney = journey.completedLevels.includes(10)
      ? await saveLevelOutput(journeyId, 10, output)
      : await advanceLevel(journeyId, 10, output);

    const approvedJourney = updatedJourney.publishStatus === "REVIEWING"
      ? await transitionPublishStatus(journeyId, "APPROVED")
      : updatedJourney;
    const { work, badge } = await upsertPublishedWorkCard(journeyId, body);

    return Response.json({
      ok: true,
      data: {
        journeyId: approvedJourney.id,
        currentLevel: approvedJourney.currentLevel,
        completedLevels: approvedJourney.completedLevels,
        publishStatus: approvedJourney.publishStatus,
        workId: work.id,
        badgeId: badge.id,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "第10关完成失败",
        code: "LEVEL10_COMPLETE_FAILED",
      },
      { status: 422 }
    );
  }
}
