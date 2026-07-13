import { askTutor } from "@/lib/ai/client";
import { prisma } from "@/lib/db";
import { TutorChatRequestSchema } from "@/types";

type TutorRouteContext = {
  params: Promise<{ journeyId: string }>;
};

export async function POST(request: Request, context: TutorRouteContext) {
  const { journeyId } = await context.params;

  let body;
  try {
    body = TutorChatRequestSchema.parse(await request.json());
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
    });

    const history = await prisma.conversation.findMany({
      where: { journeyId, level: body.level },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const tutorReply = await askTutor({
      journey,
      level: body.level,
      message: body.message,
      history: history
        .reverse()
        .filter((item) => item.role === "user" || item.role === "assistant")
        .map((item) => ({
          role: item.role as "user" | "assistant",
          content: item.content,
        })),
    });

    const [, assistantMessage] = await prisma.$transaction([
      prisma.conversation.create({
        data: {
          journeyId,
          level: body.level,
          role: "user",
          content: body.message,
        },
      }),
      prisma.conversation.create({
        data: {
          journeyId,
          level: body.level,
          role: "assistant",
          content: tutorReply.text,
          structuredOutput: tutorReply.structuredOutput || undefined,
        },
      }),
    ]);

    return Response.json({
      ok: true,
      data: {
        conversationId: assistantMessage.id,
        text: tutorReply.text,
        structuredOutput: tutorReply.structuredOutput,
        provider: tutorReply.provider,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "AI Tutor 调用失败",
        code: "AI_TUTOR_FAILED",
      },
      { status: 422 }
    );
  }
}
