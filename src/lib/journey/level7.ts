import { z } from "zod";
import { Level7OutputSchema } from "@/types";

export const Level7CompleteRequestSchema = z.object({
  vision: z.string().min(1),
  aiAction: z.string().min(1),
  awareness: z.string().min(1),
  behavior: z.string().min(1),
  result: z.string().min(1),
  demoPlan: z.string().min(1),
  effectVerification: z.string().min(1),
  responsibilityDecision: z.string().optional(),
});

export type Level7CompleteRequest = z.infer<typeof Level7CompleteRequestSchema>;

export function buildLevel7Output(input: Level7CompleteRequest) {
  return Level7OutputSchema.parse({
    vision: input.vision,
    aiAction: input.aiAction,
    abcCanvas: {
      A_awareness: input.awareness,
      B_behavior: input.behavior,
      C_result: input.result,
    },
    demoPlan: input.demoPlan,
    effectVerification: input.effectVerification,
    responsibilityDecision: input.responsibilityDecision || undefined,
  });
}
