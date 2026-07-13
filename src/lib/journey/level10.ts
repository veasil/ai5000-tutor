import { z } from "zod";
import { prisma } from "@/lib/db";
import { Level10OutputSchema } from "@/types";
import { LEVEL_TO_POWER } from "./state-machine";

export const Level10CompleteRequestSchema = z.object({
  title: z.string().min(1).max(50),
  problem: z.string().min(1),
  solution: z.string().min(1),
  audience: z.string().min(1),
  videoUrl: z.string().min(1),
  responsibilityStatement: z.string().min(10),
  workCardReady: z.literal(true),
  allChecksPassed: z.literal(true),
  parentConfirm: z.literal(true),
});

export type Level10CompleteRequest = z.infer<typeof Level10CompleteRequestSchema>;

export function buildLevel10Output(input: Level10CompleteRequest) {
  return Level10OutputSchema.parse({
    publishScript: {
      problem: input.problem,
      solution: input.solution,
      audience: input.audience,
    },
    videoUrl: input.videoUrl,
    workCardGenerated: input.workCardReady,
    allChecksPassed: input.allChecksPassed,
    parentConfirm: input.parentConfirm,
  });
}

export async function upsertPublishedWorkCard(
  journeyId: string,
  input: Level10CompleteRequest
) {
  const journey = await prisma.journey.findUniqueOrThrow({
    where: { id: journeyId },
    include: {
      child: {
        select: {
          id: true,
          anonymousName: true,
          ageStage: true,
        },
      },
    },
  });

  const completedLevels = Array.from(new Set([...journey.completedLevels, 10]));
  const usedPowers = Array.from(
    new Set(completedLevels.map((level) => LEVEL_TO_POWER[level]).filter(Boolean))
  );
  const riskTypes = journey.selectedIssue ? [journey.selectedIssue] : [];

  const [work, badge] = await prisma.$transaction([
    prisma.work.upsert({
      where: { journeyId },
      update: {
        title: input.title,
        creatorNickname: journey.child.anonymousName,
        ageStage: journey.child.ageStage,
        riskTypes,
        usedPowers,
        demoUrl: journey.demoUrl,
        videoUrl: input.videoUrl,
        responsibilityStatement: input.responsibilityStatement,
        slogan: journey.slogan,
        publishStatus: "approved",
        reviewedBy: "mvp-auto",
        reviewedAt: new Date(),
        publishedAt: new Date(),
      },
      create: {
        journeyId,
        title: input.title,
        creatorNickname: journey.child.anonymousName,
        ageStage: journey.child.ageStage,
        riskTypes,
        usedPowers,
        demoUrl: journey.demoUrl,
        videoUrl: input.videoUrl,
        responsibilityStatement: input.responsibilityStatement,
        slogan: journey.slogan,
        publishStatus: "approved",
        reviewedBy: "mvp-auto",
        reviewedAt: new Date(),
        publishedAt: new Date(),
      },
    }),
    prisma.badge.upsert({
      where: { journeyId },
      update: {
        childId: journey.child.id,
        type: "负责任开发者",
        power: "COMMUNICATION",
      },
      create: {
        journeyId,
        childId: journey.child.id,
        type: "负责任开发者",
        power: "COMMUNICATION",
      },
    }),
  ]);

  return { work, badge };
}
