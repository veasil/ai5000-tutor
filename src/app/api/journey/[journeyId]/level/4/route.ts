import { prisma } from "@/lib/db";
import {
  buildLevel4Output,
  Level4CompleteRequestSchema,
} from "@/lib/journey/level4";
import { advanceLevel } from "@/lib/journey/state-machine";

type Level4RouteContext = {
  params: Promise<{ journeyId: string }>;
};

export async function POST(request: Request, context: Level4RouteContext) {
  const { journeyId } = await context.params;

  let body;
  try {
    body = Level4CompleteRequestSchema.parse(await request.json());
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

    const output = buildLevel4Output(body);
    const updatedJourney = await advanceLevel(journeyId, 4, output);

    return Response.json({
      ok: true,
      data: {
        journeyId: updatedJourney.id,
        currentLevel: updatedJourney.currentLevel,
        completedLevels: updatedJourney.completedLevels,
        entryWindow: updatedJourney.entryWindow,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "第4关完成失败",
        code: "LEVEL4_COMPLETE_FAILED",
      },
      { status: 422 }
    );
  }
}
