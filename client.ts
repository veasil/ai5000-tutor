// src/lib/ai/client.ts
// ⚠️ 所有 AI 调用必须通过此文件。禁止在其他地方直接实例化 Anthropic。

import Anthropic from "@anthropic-ai/sdk";

// 单例，避免在 Next.js dev 模式下重复创建
const globalForAI = global as unknown as { anthropic: Anthropic };

export const anthropic =
  globalForAI.anthropic ||
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

if (process.env.NODE_ENV !== "production") {
  globalForAI.anthropic = anthropic;
}

// ── 类型定义 ─────────────────────────────────────────────────────

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorCallOptions {
  journeyId: string;
  level: number;         // 1-10
  currentPower: string;  // FivePower enum value
  ageStage: string;      // AgeStage enum value
  history: TutorMessage[];
  userMessage: string;
  maxTokens?: number;
}

export interface TutorResponse {
  text: string;
  structuredOutput: Record<string, unknown> | null;
  inputTokens: number;
  outputTokens: number;
}

// ── 核心调用函数（非流式，用于保存结构化输出）────────────────────

export async function callTutor(
  options: TutorCallOptions
): Promise<TutorResponse> {
  const { buildSystemPrompt } = await import("./prompts/system");
  const { buildStagePrompt } = await import("./prompts/stages");
  const { checkGuardrails } = await import("./safety");

  // 1. 红灯检查（用户输入）
  const inputSafetyResult = await checkGuardrails(options.userMessage);
  if (!inputSafetyResult.safe) {
    return {
      text: inputSafetyResult.safetyResponse,
      structuredOutput: { _safetyFlag: inputSafetyResult.flagType },
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  // 2. 构造 prompt
  const systemPrompt = buildSystemPrompt(options.ageStage);
  const stagePrompt = buildStagePrompt(options.level, options.currentPower);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: options.maxTokens ?? 1000,
    system: `${systemPrompt}\n\n${stagePrompt}`,
    messages: [
      ...options.history,
      { role: "user", content: options.userMessage },
    ],
  });

  const fullText = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  // 3. 提取 JSON 结构化输出（AI 被要求在回复末尾附加 JSON block）
  const structuredOutput = extractStructuredOutput(fullText);

  // 4. 红灯检查（AI 输出）
  const outputSafetyResult = await checkGuardrails(fullText);
  if (!outputSafetyResult.safe) {
    // AI 输出触发红灯，记录但不阻止（已是安全提示）
    console.warn("[AI Safety] Output triggered guardrail:", outputSafetyResult.flagType);
  }

  return {
    text: stripJsonBlock(fullText),
    structuredOutput,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// ── 流式调用（用于实时对话显示）─────────────────────────────────

export async function* streamTutor(
  options: TutorCallOptions
): AsyncGenerator<string> {
  const { buildSystemPrompt } = await import("./prompts/system");
  const { buildStagePrompt } = await import("./prompts/stages");
  const { checkGuardrails } = await import("./safety");

  const inputSafetyResult = await checkGuardrails(options.userMessage);
  if (!inputSafetyResult.safe) {
    yield inputSafetyResult.safetyResponse;
    return;
  }

  const systemPrompt = buildSystemPrompt(options.ageStage);
  const stagePrompt = buildStagePrompt(options.level, options.currentPower);

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: options.maxTokens ?? 1000,
    system: `${systemPrompt}\n\n${stagePrompt}`,
    messages: [
      ...options.history,
      { role: "user", content: options.userMessage },
    ],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      yield chunk.delta.text;
    }
  }
}

// ── 工具函数 ─────────────────────────────────────────────────────

function extractStructuredOutput(text: string): Record<string, unknown> | null {
  // AI 被要求在回复末尾附加 ```json {...} ``` 块
  const match = text.match(/```json\s*([\s\S]*?)\s*```\s*$/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    console.warn("[AI Client] Failed to parse structured output:", match[1]);
    return null;
  }
}

function stripJsonBlock(text: string): string {
  return text.replace(/```json\s*([\s\S]*?)\s*```\s*$/, "").trim();
}
