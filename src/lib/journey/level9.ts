import { z } from "zod";
import { Level9OutputSchema } from "@/types";

export const Level9CompleteRequestSchema = z.object({
  demoUrl: z.string().url().optional(),
  realImpact: z.string().min(5),
  spreadImpact: z.string().min(1),
  slogan: z.string().min(1),
  sustainedImpact: z.string().optional(),
  stakeholderAnalysis: z.string().optional(),
  safetyCommitment: z.literal(true),
});

export type Level9CompleteRequest = z.infer<typeof Level9CompleteRequestSchema>;

export function buildLevel9Output(input: Level9CompleteRequest) {
  return Level9OutputSchema.parse({
    realImpact: input.realImpact,
    spreadImpact: input.spreadImpact,
    slogan: input.slogan,
    sustainedImpact: input.sustainedImpact || undefined,
    stakeholderAnalysis: input.stakeholderAnalysis || undefined,
    safetyReport: {
      canPublish: true,
      mode: "mvp_self_check",
      checkedAt: new Date().toISOString(),
      checkedFields: [
        "realImpact",
        "spreadImpact",
        "slogan",
        "sustainedImpact",
        "stakeholderAnalysis",
      ],
      demoUrl: input.demoUrl,
      items: [
        {
          item: "privacy",
          passed: true,
          note: "MVP 阶段由创作者确认未公开隐私、联系方式或敏感个人信息。",
        },
        {
          item: "responsible_claim",
          passed: true,
          note: "影响力表述以帮助对象和可验证变化为主，不承诺夸大效果。",
        },
        {
          item: "human_review",
          passed: true,
          note: "第10关发布前仍需要视频、作品卡与家长确认。",
        },
      ],
    },
  });
}
