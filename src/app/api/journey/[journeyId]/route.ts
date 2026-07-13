import { prisma } from "@/lib/db";

type JourneyRouteContext = {
  params: Promise<{ journeyId: string }>;
};

export async function GET(_request: Request, context: JourneyRouteContext) {
  const { journeyId } = await context.params;

  try {
    const journey = await prisma.journey.findUniqueOrThrow({
      where: { id: journeyId },
      include: {
        child: {
          select: {
            id: true,
            anonymousName: true,
            ageStage: true,
            identity: true,
            organizationId: true,
          },
        },
        conversations: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    return Response.json({
      ok: true,
      data: {
        ...journey,
        createdAt: journey.createdAt.toISOString(),
        updatedAt: journey.updatedAt.toISOString(),
        conversations: journey.conversations.map((conversation) => ({
          ...conversation,
          createdAt: conversation.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "旅程不存在",
        code: "JOURNEY_NOT_FOUND",
      },
      { status: 404 }
    );
  }
}
