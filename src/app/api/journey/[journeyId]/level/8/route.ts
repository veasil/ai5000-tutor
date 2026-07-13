import { prisma } from "@/lib/db";
import {
  buildLevel8Output,
  Level8CompleteRequestSchema,
} from "@/lib/journey/level8";
import { advanceLevel } from "@/lib/journey/state-machine";

type Level8RouteContext = {
  params: Promise<{ journeyId: string }>;
};

export async function POST(request: Request, context: Level8RouteContext) {
  const { journeyId } = await context.params;

  let body;
  try {
    body = Level8CompleteRequestSchema.parse(await request.json());
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

    const output = buildLevel8Output(body);
    const updatedJourney = await advanceLevel(journeyId, 8, output);

    return Response.json({
      ok: true,
      data: {
        journeyId: updatedJourney.id,
        currentLevel: updatedJourney.currentLevel,
        completedLevels: updatedJourney.completedLevels,
        demoUrl: updatedJourney.demoUrl,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "第8关完成失败",
        code: "LEVEL8_COMPLETE_FAILED",
      },
      { status: 422 }
    );
  }
}
