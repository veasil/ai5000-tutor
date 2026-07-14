import { z } from "zod";
import {
  CardPlayRecordSchema,
  Level1OutputSchema,
  WqtReviewSnapshotSchema,
} from "@/types";

const ChoiceSchema = z.enum(["A", "B", "C", "D"]);

const WqtLevel1InputSchema = z.object({
  entryChoice: z.enum(["RECOMMEND", "IDEA"]).default("RECOMMEND"),
  ideaText: z.string().optional(),
  powerScores: z.object({
    bodySafety: z.number().min(1).max(5),
    mentalSafety: z.number().min(1).max(5),
    socialSafety: z.number().min(1).max(5),
    economicSafety: z.number().min(1).max(5),
    digitalRights: z.number().min(1).max(5),
  }).optional(),
  top3Concerns: z.array(z.string().min(1)).length(3).optional(),
  wqtSessionId: z.string().min(1),
  wqtReviewSnapshot: WqtReviewSnapshotSchema,
  wqtReviewReportUrl: z.string().url().optional(),
});

export type WqtLevel1Input = z.infer<typeof WqtLevel1InputSchema>;

export function parseWqtLevel1Input(input: unknown): WqtLevel1Input {
  return WqtLevel1InputSchema.parse(input);
}

export function buildLevel1OutputFromWqt(input: WqtLevel1Input) {
  const cardsPlayed = deriveCardsPlayed(input.wqtReviewSnapshot.cards);
  const top3Concerns = input.top3Concerns || deriveTop3Concerns(input.wqtReviewSnapshot.cards);

  return Level1OutputSchema.parse({
    entryChoice: input.entryChoice,
    ideaText: input.ideaText,
    powerScores: input.powerScores,
    cardsPlayed,
    top3Concerns,
    wqtSessionId: input.wqtSessionId,
    wqtReviewSnapshot: input.wqtReviewSnapshot,
    wqtReviewReportUrl: input.wqtReviewReportUrl,
  });
}

function deriveCardsPlayed(cards: Array<Record<string, unknown>>) {
  return cards.map((card, index) => {
    const selectedOption = normalizeChoice(card.choice);

    return CardPlayRecordSchema.parse({
      cardId: String(card.cardId || card.cardCode || `wqt-card-${index + 1}`),
      selectedOption,
      customOption: selectedOption === "D" ? stringOrUndefined(card.optionText) : undefined,
      powerChanges: normalizePowerChanges(card.attributeDelta),
    });
  });
}

function deriveTop3Concerns(cards: Array<Record<string, unknown>>) {
  const counts = new Map<string, number>();

  for (const card of cards) {
    const concern =
      stringOrUndefined(card.safetyType) ||
      stringOrUndefined(card.subtopic) ||
      stringOrUndefined(card.phase);
    if (!concern) continue;
    counts.set(concern, (counts.get(concern) || 0) + 1);
  }

  const concerns = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([concern]) => concern)
    .slice(0, 3);

  const fallbacks = ["身体安全", "心理安全", "社交安全"];
  for (const fallback of fallbacks) {
    if (concerns.length >= 3) break;
    if (!concerns.includes(fallback)) concerns.push(fallback);
  }

  return concerns;
}

function normalizeChoice(value: unknown) {
  const choice = String(value || "").trim().toUpperCase();
  const parsed = ChoiceSchema.safeParse(choice);
  return parsed.success ? parsed.data : "A";
}

function normalizePowerChanges(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, raw]) => [key, Number(raw) || 0])
  );
}

function stringOrUndefined(value: unknown) {
  const text = String(value || "").trim();
  return text || undefined;
}
