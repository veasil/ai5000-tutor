import Anthropic from "@anthropic-ai/sdk";
import type { Journey } from "@prisma/client";
import { XIAOWU_SYSTEM_PROMPT } from "./prompts/system";

type TutorMessage = {
  role: "user" | "assistant";
  content: string;
};

type AskTutorInput = {
  journey: Journey;
  level: number;
  message: string;
  history: TutorMessage[];
};

let anthropic: Anthropic | null = null;

export async function askTutor(input: AskTutorInput) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return buildLocalTutorReply(input);

  anthropic ??= new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
    max_tokens: 700,
    system: buildSystemPrompt(input),
    messages: [
      ...input.history.map((item) => ({
        role: item.role,
        content: item.content,
      })),
      { role: "user", content: input.message },
    ],
  });

  return {
    text: extractText(response.content),
    structuredOutput: null,
    provider: "anthropic",
  };
}

function buildLocalTutorReply(input: AskTutorInput) {
  return {
    text: [
      `我在第 ${input.level} 关陪你。`,
      "现在先不急着做大东西，我们只抓一个小线索：你最想让谁的生活变好一点点？",
      "你可以用一句话回答：我想帮助___，因为他们遇到___。",
    ].join("\n"),
    structuredOutput: null,
    provider: "local-fallback",
  };
}

function buildSystemPrompt(input: AskTutorInput) {
  return [
    XIAOWU_SYSTEM_PROMPT,
    "",
    `当前 journeyId: ${input.journey.id}`,
    `当前关卡: ${input.level}`,
    `已完成关卡: ${input.journey.completedLevels.join(", ") || "无"}`,
    "回复必须包含孩子能马上回答的一个问题。",
  ].join("\n");
}

function extractText(content: unknown) {
  if (!Array.isArray(content)) return "";

  return content
    .map((part) => {
      if (!part || typeof part !== "object" || !("text" in part)) return "";
      return String((part as { text?: unknown }).text || "");
    })
    .filter(Boolean)
    .join("\n");
}
