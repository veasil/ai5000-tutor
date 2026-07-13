import { z } from "zod";
import { Level6OutputSchema } from "@/types";

export const Level6CompleteRequestSchema = z.object({
  promptTemplate: z.string().min(1),
  testPlan: z.string().min(1),
  modularPlan: z.string().min(1),
  securityRule: z.string().min(1),
  ethicsReminder: z.string().min(1),
  collaborationText: z.string().min(1),
  safetyText: z.string().min(1),
  ethicsText: z.string().min(1),
});

export type Level6CompleteRequest = z.infer<typeof Level6CompleteRequestSchema>;

export function buildLevel6Output(input: Level6CompleteRequest) {
  return Level6OutputSchema.parse({
    modules: [
      { moduleId: "PROMPT", content: input.promptTemplate },
      { moduleId: "TEST", content: input.testPlan },
      { moduleId: "MODULAR", content: input.modularPlan },
      { moduleId: "SECURITY", content: input.securityRule },
      { moduleId: "ETHICS", content: input.ethicsReminder },
    ],
    simplifiedModules: [
      { moduleId: "PROMPT_TEMPLATE", content: input.promptTemplate },
      { moduleId: "SAFETY_RULE", content: input.securityRule },
      { moduleId: "ETHICS_REMINDER", content: input.ethicsReminder },
    ],
    collaborationChecklist: splitLines(input.collaborationText),
    safetyItems: splitLines(input.safetyText),
    ethicsItems: splitLines(input.ethicsText),
  });
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,|，/)
    .map((item) => item.trim())
    .filter(Boolean);
}
