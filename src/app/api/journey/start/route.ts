import { prisma } from "@/lib/db";
import {
  JourneyStartRequestSchema,
  JourneyStartResponseSchema,
} from "@/types";

export async function POST(request: Request) {
  let childId: string;

  try {
    childId = JourneyStartRequestSchema.parse(await request.json()).childId;
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
    await prisma.child.findUniqueOrThrow({ where: { id: childId } });
    const journey = await prisma.journey.create({ data: { childId } });

    return Response.json({
      ok: true,
      data: JourneyStartResponseSchema.parse({
        journeyId: journey.id,
        currentLevel: journey.currentLevel,
        currentPower: journey.currentPower,
      }),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "创建旅程失败",
        code: "JOURNEY_START_FAILED",
      },
      { status: 422 }
    );
  }
}
