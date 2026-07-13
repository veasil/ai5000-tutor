import { z } from "zod";
import { Level3OutputSchema, ResearchMaterialSchema } from "@/types";

export const Level3CompleteRequestSchema = z.object({
  protagonist: z.string().min(1),
  plot: z.string().min(10),
  evidence: z.string().min(1),
  materialMethod: z.enum(["MEMORY", "PEER", "COMMUNITY", "INTERNET"]).default("MEMORY"),
  materialContent: z.string().min(1),
});

export type Level3CompleteRequest = z.infer<typeof Level3CompleteRequestSchema>;

export function buildLevel3Output(input: Level3CompleteRequest) {
  const material = ResearchMaterialSchema.parse({
    method: input.materialMethod,
    content: input.materialContent,
    followUps: [
      {
        round: 1,
        question: "这件事发生在什么具体场景里？",
        answer: input.plot,
      },
      {
        round: 2,
        question: "你看到或听到的证据是什么？",
        answer: input.evidence,
      },
      {
        round: 3,
        question: "这件事为什么值得继续做成一个 AI 小作品？",
        answer: input.materialContent,
      },
    ],
  });

  return Level3OutputSchema.parse({
    protagonist: input.protagonist,
    plot: input.plot,
    evidence: input.evidence,
    materialSources: [material],
  });
}
