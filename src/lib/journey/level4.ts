import { z } from "zod";
import { Level4OutputSchema } from "@/types";

export const Level4CompleteRequestSchema = z.object({
  surfaceDescription: z.string().min(1),
  stakeholdersText: z.string().min(1),
  rootCausesText: z.string().min(1),
  previousWho: z.string().min(1),
  previousWhat: z.string().min(1),
  previousWhyFailed: z.string().min(1),
  entryWindow: z.string().min(1),
});

export type Level4CompleteRequest = z.infer<typeof Level4CompleteRequestSchema>;

export function buildLevel4Output(input: Level4CompleteRequest) {
  return Level4OutputSchema.parse({
    surfaceDescription: input.surfaceDescription,
    stakeholders: splitLines(input.stakeholdersText),
    rootCauses: splitLines(input.rootCausesText),
    previousAttempts: [
      {
        who: input.previousWho,
        what: input.previousWhat,
        whyFailed: input.previousWhyFailed,
      },
    ],
    entryWindow: input.entryWindow,
  });
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,|，/)
    .map((item) => item.trim())
    .filter(Boolean);
}
