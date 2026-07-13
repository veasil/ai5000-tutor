import { z } from "zod";
import { Level8OutputSchema } from "@/types";

export const Level8CompleteRequestSchema = z.object({
  demoUrl: z.string().url(),
  iterationChanges: z.string().min(1),
  iterationTestResult: z.string().min(1),
  responsibilityReview: z.string().min(1),
  engineeringCheckpoint: z.literal(true),
  bodyRelaxCheckpoint: z.literal(true),
  edgeOneAssetId: z.string().optional(),
});

export type Level8CompleteRequest = z.infer<typeof Level8CompleteRequestSchema>;

export function buildLevel8Output(input: Level8CompleteRequest) {
  return Level8OutputSchema.parse({
    demoUrl: input.demoUrl,
    iterations: [
      {
        version: 1,
        changes: input.iterationChanges,
        testResult: input.iterationTestResult,
        responsibilityNote: input.responsibilityReview,
      },
    ],
    responsibilityReview: input.responsibilityReview,
    engineeringCheckpoint: input.engineeringCheckpoint,
    bodyRelaxCheckpoint: input.bodyRelaxCheckpoint,
    edgeOneAssetId: input.edgeOneAssetId || undefined,
  });
}
