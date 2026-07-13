import { advanceLevel } from "@/lib/journey/state-machine";
import {
  buildLevel2Output,
  Level2CompleteRequestSchema,
} from "@/lib/journey/level2";
import { prisma } from "@/lib/db";

type Level2RouteContext = {
  params: Promise<{ journeyId: string }>;
};

export async function POST(request: Request, context: Level2RouteContext) {
  const { journeyId } = await context.params;

  let body;
  try {
    body = Level2CompleteRequestSchema.parse(await request.json());
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
      select: { top3Concerns: true },
    });

    const output = buildLevel2Output(journey.top3Concerns, body);
    const updatedJourney = await advanceLevel(journeyId, 2, output);

    return Response.json({
      ok: true,
      data: {
        journeyId: updatedJourney.id,
        currentLevel: updatedJourney.currentLevel,
        completedLevels: updatedJourney.completedLevels,
        selectedIssue: updatedJourney.selectedIssue,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "第2关完成失败",
        code: "LEVEL2_COMPLETE_FAILED",
      },
      { status: 422 }
    );
  }
}
