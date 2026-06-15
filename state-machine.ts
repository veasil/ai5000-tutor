// src/lib/journey/state-machine.ts
// 五力状态机核心逻辑。所有关卡推进必须经过此函数。

import { prisma } from "@/lib/db";
import type { Journey, FivePower, PublishStatus } from "@prisma/client";

// ── 关卡 → 五力映射 ─────────────────────────────────────────────

export const LEVEL_TO_POWER: Record<number, FivePower> = {
  1: "SAFETY",
  2: "SAFETY",
  3: "BRAINWAVE",
  4: "BRAINWAVE",
  5: "SENSING",
  6: "SENSING",
  7: "CREATIVITY",
  8: "CREATIVITY",
  9: "SAFETY",        // 安全力闭环（发布前责任检查）
  10: "COMMUNICATION",
};

export const LEVEL_NAMES: Record<number, string> = {
  1: "小伍风险冒险局",
  2: "责任议题锁定",
  3: "AI共创准备站",
  4: "Prompt表达训练",
  5: "实感力启动",
  6: "问题侦探局",
  7: "愿景与方案站",
  8: "Demo工坊",
  9: "责任检查站",
  10: "小伍创客发布会",
};

// ── 前置条件检查 ─────────────────────────────────────────────────

/**
 * 检查能否进入指定关卡
 * 规则：
 * 1. 不能跨关（必须按顺序）
 * 2. 第3关以后必须完成第1-2关
 * 3. 第9关（发布前检查）是强制节点，跳不过
 * 4. 第10关必须第9关通过
 */
export function canAdvanceToLevel(
  journey: Pick<Journey, "completedLevels" | "safetyReport">,
  targetLevel: number
): { allowed: boolean; reason?: string } {
  if (targetLevel < 1 || targetLevel > 10) {
    return { allowed: false, reason: "关卡不存在" };
  }

  // 必须按顺序解锁
  if (targetLevel > 1) {
    const prevLevel = targetLevel - 1;
    if (!journey.completedLevels.includes(prevLevel)) {
      return {
        allowed: false,
        reason: `请先完成第${prevLevel}关"${LEVEL_NAMES[prevLevel]}"`,
      };
    }
  }

  // 第10关需要第9关（安全检查）通过
  if (targetLevel === 10 && !journey.safetyReport) {
    return {
      allowed: false,
      reason: "请先完成第9关责任检查站",
    };
  }

  return { allowed: true };
}

// ── 关卡完成 & 状态推进 ──────────────────────────────────────────

export type LevelOutput = Partial<{
  // 第1关
  topIssues: string[];
  // 第2关
  selectedIssue: string;
  riskTypes: string[];
  responsibilityBoundary: object;
  // 第3关
  aiEdgeList: object;
  // 第4关
  promptDraft: object;
  aiCollabCard: object;
  // 第5关
  issueStory: object;
  // 第6关
  deepDive: object;
  // 第7关
  vision: string;
  aiActions: object;
  // 第8关
  abcCanvas: object;
  demoUrl: string;
  demoTemplateId: string;
  effectCheck: object;
  // 第9关
  safetyReport: object;
  // 第10关
  threeLines: object;
  videoScript: object;
  videoUrl: string;
}>;

/**
 * 完成一关并推进到下一关
 * 返回更新后的 Journey
 */
export async function completeLevel(
  journeyId: string,
  completedLevel: number,
  output: LevelOutput
): Promise<Journey> {
  const journey = await prisma.journey.findUniqueOrThrow({
    where: { id: journeyId },
  });

  // 校验
  const check = canAdvanceToLevel(journey, completedLevel);
  if (!check.allowed) {
    throw new Error(check.reason);
  }

  const nextLevel = completedLevel < 10 ? completedLevel + 1 : 10;
  const nextPower = LEVEL_TO_POWER[nextLevel];

  // 第9关通过后允许进入 reviewing 状态
  let publishStatus: PublishStatus = journey.publishStatus;
  if (completedLevel === 9 && output.safetyReport) {
    publishStatus = "REVIEWING";
  }

  // 事务：更新 Journey + 写状态日志
  const [updatedJourney] = await prisma.$transaction([
    prisma.journey.update({
      where: { id: journeyId },
      data: {
        completedLevels: { push: completedLevel },
        currentLevel: nextLevel,
        currentPower: nextPower,
        publishStatus,
        ...output,
      },
    }),
    prisma.journeyLog.create({
      data: {
        journeyId,
        fromLevel: completedLevel,
        toLevel: nextLevel,
        fromPower: LEVEL_TO_POWER[completedLevel],
        toPower: nextPower,
        trigger: "level_complete",
        metadata: { outputKeys: Object.keys(output) },
      },
    }),
  ]);

  return updatedJourney;
}

// ── 红灯记录 ────────────────────────────────────────────────────

export async function recordSafetyFlag(
  journeyId: string,
  flagType: string,
  context: string
): Promise<void> {
  const journey = await prisma.journey.findUniqueOrThrow({
    where: { id: journeyId },
    select: { safetyFlags: true },
  });

  const flags = (journey.safetyFlags as object[]) ?? [];
  flags.push({
    type: flagType,
    context: context.slice(0, 200), // 只存前200字
    timestamp: new Date().toISOString(),
  });

  await prisma.journey.update({
    where: { id: journeyId },
    data: { safetyFlags: flags },
  });
}
