import { prisma } from "@/lib/db";
import {
  buildLevel7Output,
  Level7CompleteRequestSchema,
} from "@/lib/journey/level7";
import { advanceLevel } from "@/lib/journey/state-machine";

type Level7RouteContext = {
  params: Promise<{ journeyId: string }>;
};

export async function POST(request: Request, context: Level7RouteContext) {
  const { journeyId } = await context.params;

  let body;
  try {
    body = Level7CompleteRequestSchema.parse(await request.json());
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

    const output = buildLevel7Output(body);
    const updatedJourney = await advanceLevel(journeyId, 7, output);

    return Response.json({
      ok: true,
      data: {
        journeyId: updatedJourney.id,
        currentLevel: updatedJourney.currentLevel,
        completedLevels: updatedJourney.completedLevels,
        vision: updatedJourney.vision,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "第7关完成失败",
        code: "LEVEL7_COMPLETE_FAILED",
      },
      { status: 422 }
    );
  }
}
