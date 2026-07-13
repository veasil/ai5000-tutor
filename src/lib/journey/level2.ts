import { z } from "zod";
import { Level2OutputSchema } from "@/types";

export const Level2CompleteRequestSchema = z.object({
  selectedIssueIndex: z.number().int().min(0).max(2),
  selectedIssue: z.string().min(1).optional(),
});

export type Level2CompleteRequest = z.infer<typeof Level2CompleteRequestSchema>;

export function buildLevel2Output(
  top3Concerns: string[],
  input: Level2CompleteRequest
) {
  const issues = normalizeConcerns(top3Concerns);
  const selectedIssue = input.selectedIssue || issues[input.selectedIssueIndex];

  return Level2OutputSchema.parse({
    threeIssueEvals: issues.map((issue, index) => ({
      issue,
      fiveDim: buildDefaultFiveDim(index === input.selectedIssueIndex),
      followUps: [],
    })),
    systemRecommendation: selectedIssue,
    selectedIssue,
    selectedIssueIndex: input.selectedIssueIndex,
  });
}

function normalizeConcerns(top3Concerns: string[]) {
  const concerns = top3Concerns.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  const fallbacks = ["身体安全", "心理安全", "社交安全"];

  for (const fallback of fallbacks) {
    if (concerns.length >= 3) break;
    if (!concerns.includes(fallback)) concerns.push(fallback);
  }

  return concerns;
}

function buildDefaultFiveDim(isSelected: boolean) {
  const score = isSelected ? 5 : 4;

  return {
    resonance: score,
    responsibility: score,
    originality: 4,
    embeddedness: 4,
    feasibility: score,
  };
}
