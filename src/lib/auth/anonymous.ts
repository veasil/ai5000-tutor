import { prisma } from "@/lib/db";
import {
  AnonymousLoginRequestSchema,
  AnonymousLoginResponseSchema,
} from "@/types";

export async function createAnonymousChild(input: unknown) {
  const parsed = AnonymousLoginRequestSchema.parse(input);
  const anonymousName = await generateUniqueAnonymousName();

  const child = await prisma.child.create({
    data: {
      anonymousName,
      ageStage: parsed.ageStage,
      mode: parsed.playMode || "CREATOR",
      identity: "GUEST",
    },
  });

  return AnonymousLoginResponseSchema.parse({
    childId: child.id,
    anonymousName: child.anonymousName,
    token: `dev-child:${child.id}`,
  });
}

async function generateUniqueAnonymousName() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const anonymousName = `小伍创客${suffix}`;
    const existing = await prisma.child.findUnique({ where: { anonymousName } });
    if (!existing) return anonymousName;
  }

  throw new Error("匿名名生成连续冲突，请稍后重试");
}
