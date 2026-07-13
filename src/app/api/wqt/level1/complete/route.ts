import { NextRequest } from "next/server";
import { z } from "zod";
import { advanceLevel } from "@/lib/journey/state-machine";
import {
  buildLevel1OutputFromWqt,
  parseWqtLevel1Input,
} from "@/lib/wqt/level1";
import { WqtReviewSnapshotSchema } from "@/types";

const CompleteLevel1RequestSchema = z.object({
  journeyId: z.string().min(1),
  wqtSessionId: z.union([z.string(), z.number()]).transform(String),
  reviewSnapshot: WqtReviewSnapshotSchema,
  reportUrl: z.string().url().optional(),
  wqtReviewReportUrl: z.string().url().optional(),
  entryChoice: z.enum(["RECOMMEND", "IDEA"]).default("RECOMMEND"),
  ideaText: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (!isAuthorizedCallback(request)) {
    return Response.json(
      { ok: false, error: "WQT 回调密钥不正确", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  let parsedBody: z.infer<typeof CompleteLevel1RequestSchema>;
  try {
    parsedBody = CompleteLevel1RequestSchema.parse(await request.json());
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
    const levelOutput = buildLevel1OutputFromWqt(
      parseWqtLevel1Input({
        entryChoice: parsedBody.entryChoice,
        ideaText: parsedBody.ideaText,
        wqtSessionId: parsedBody.wqtSessionId,
        wqtReviewSnapshot: parsedBody.reviewSnapshot,
        wqtReviewReportUrl: parsedBody.wqtReviewReportUrl || parsedBody.reportUrl,
      })
    );

    const journey = await advanceLevel(parsedBody.journeyId, 1, levelOutput);

    return Response.json({
      ok: true,
      data: {
        journeyId: journey.id,
        currentLevel: journey.currentLevel,
        completedLevels: journey.completedLevels,
        wqtSessionId: journey.wqtSessionId,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "第1关完成回调失败",
        code: "LEVEL1_WQT_COMPLETE_FAILED",
      },
      { status: 422 }
    );
  }
}

function isAuthorizedCallback(request: NextRequest) {
  const expectedSecret = process.env.WQT_CALLBACK_SECRET;
  if (!expectedSecret) return true;

  return request.headers.get("x-wqt-callback-secret") === expectedSecret;
}
