import { prisma } from "@/lib/db";
import {
  buildLevel6Output,
  Level6CompleteRequestSchema,
} from "@/lib/journey/level6";
import { advanceLevel } from "@/lib/journey/state-machine";

type Level6RouteContext = {
  params: Promise<{ journeyId: string }>;
};

export async function POST(request: Request, context: Level6RouteContext) {
  const { journeyId } = await context.params;

  let body;
  try {
    body = Level6CompleteRequestSchema.parse(await request.json());
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

    const output = buildLevel6Output(body);
    const updatedJourney = await advanceLevel(journeyId, 6, output);

    return Response.json({
      ok: true,
      data: {
        journeyId: updatedJourney.id,
        currentLevel: updatedJourney.currentLevel,
        completedLevels: updatedJourney.completedLevels,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "第6关完成失败",
        code: "LEVEL6_COMPLETE_FAILED",
      },
      { status: 422 }
    );
  }
}
