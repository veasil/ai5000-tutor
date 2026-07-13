import { prisma } from "@/lib/db";
import {
  buildLevel3Output,
  Level3CompleteRequestSchema,
} from "@/lib/journey/level3";
import { advanceLevel } from "@/lib/journey/state-machine";

type Level3RouteContext = {
  params: Promise<{ journeyId: string }>;
};

export async function POST(request: Request, context: Level3RouteContext) {
  const { journeyId } = await context.params;

  let body;
  try {
    body = Level3CompleteRequestSchema.parse(await request.json());
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
    await prisma.journey.findUniqueOrThrow({
      where: { id: journeyId },
      select: { id: true },
    });

    const output = buildLevel3Output(body);
    const updatedJourney = await advanceLevel(journeyId, 3, output);

    return Response.json({
      ok: true,
      data: {
        journeyId: updatedJourney.id,
        currentLevel: updatedJourney.currentLevel,
        completedLevels: updatedJourney.completedLevels,
        protagonist: updatedJourney.protagonist,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "第3关完成失败",
        code: "LEVEL3_COMPLETE_FAILED",
      },
      { status: 422 }
    );
  }
}
