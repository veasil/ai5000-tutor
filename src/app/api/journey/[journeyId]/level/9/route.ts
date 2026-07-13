import { prisma } from "@/lib/db";
import {
  buildLevel9Output,
  Level9CompleteRequestSchema,
} from "@/lib/journey/level9";
import { advanceLevel } from "@/lib/journey/state-machine";

type Level9RouteContext = {
  params: Promise<{ journeyId: string }>;
};

export async function POST(request: Request, context: Level9RouteContext) {
  const { journeyId } = await context.params;

  let body;
  try {
    body = Level9CompleteRequestSchema.parse(await request.json());
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

    const output = buildLevel9Output(body);
    const updatedJourney = await advanceLevel(journeyId, 9, output);

    return Response.json({
      ok: true,
      data: {
        journeyId: updatedJourney.id,
        currentLevel: updatedJourney.currentLevel,
        completedLevels: updatedJourney.completedLevels,
        publishStatus: updatedJourney.publishStatus,
        slogan: updatedJourney.slogan,
        safetyReport: updatedJourney.safetyReport,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "第9关完成失败",
        code: "LEVEL9_COMPLETE_FAILED",
      },
      { status: 422 }
    );
  }
}
