import { z } from "zod";
import { Level5OutputSchema } from "@/types";

export const Level5CompleteRequestSchema = z.object({
  mechanismDescription: z.string().min(10),
  aiCanDoText: z.string().min(1),
  aiCannotDoText: z.string().min(1),
  analogyDescription: z.string().optional(),
});

export type Level5CompleteRequest = z.infer<typeof Level5CompleteRequestSchema>;

export function buildLevel5Output(input: Level5CompleteRequest) {
  return Level5OutputSchema.parse({
    mechanismDescription: input.mechanismDescription,
    aiCanDo: splitLines(input.aiCanDoText),
    aiCannotDo: splitLines(input.aiCannotDoText),
    analogyDescription: input.analogyDescription || undefined,
  });
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,|，/)
    .map((item) => item.trim())
    .filter(Boolean);
}
