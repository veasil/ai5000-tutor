// src/lib/journey/state-machine.ts
// 五力状态机核心逻辑。所有关卡推进必须经过此函数。
// 与 CLAUDE.md 约定对齐：不可跳关、第9关强制安全检查、publishStatus 状态转移

import { prisma } from "@/lib/db";
import type { Journey, $Enums } from "@prisma/client";
import { getLevelConfig, validateLevelOutput } from "./level-configs";

// ═══════════════════════════════════════════════════════════════════
// 关卡 → 五力映射（与 spec 对齐）
// ═══════════════════════════════════════════════════════════════════

export const LEVEL_TO_POWER: Record<number, $Enums.FivePower> = {
  1: "SAFETY",        // 安全力觉醒
  2: "SAFETY",        // 安全力觉醒
  3: "SENSING",       // 实感力锻造
  4: "SENSING",       // 实感力锻造
  5: "BRAINWAVE",     // 脑波力启蒙
  6: "BRAINWAVE",     // 脑波力启蒙
  7: "CREATIVITY",    // 创心力迸发
  8: "CREATIVITY",    // 创心力迸发
  9: "COMMUNICATION", // 沟通力绽放
  10: "COMMUNICATION", // 沟通力绽放
};

/** 五力中文名 */
export const POWER_LABELS: Record<string, string> = {
  SAFETY: "安全力觉醒",
  SENSING: "实感力锻造",
  BRAINWAVE: "脑波力启蒙",
  CREATIVITY: "创心力迸发",
  COMMUNICATION: "沟通力绽放",
};

/** 关卡名称（从 level-configs 同步，提供便捷查询） */
export const LEVEL_NAMES: Record<number, string> = {
  1: "小伍风险冒险局",
  2: "责任议题锁定",
  3: "实感力启动",
  4: "问题侦探局",
  5: "AI机制拆解局",
  6: "AI共创准备站",
  7: "愿景与方法站",
  8: "Demo工坊",
  9: "影响力",
  10: "小伍创客发布会",
};

// ═══════════════════════════════════════════════════════════════════
// 前置条件检查
// ═══════════════════════════════════════════════════════════════════

/**
 * 检查能否进入指定关卡
 *
 * 规则（来自 CLAUDE.md "不可跳关" 约定）：
 * 1. 必须按顺序解锁（不能跨关）
 * 2. 第3关以后必须完成第1-2关（安全力觉醒是基础）
 * 3. 第9关是发布前强制安全检查节点
 * 4. 第10关必须第9关安全审核通过
 */
export function canAdvanceToLevel(
  journey: Pick<
    Journey,
    "completedLevels" | "currentLevel" | "publishStatus" | "safetyReport"
  >,
  targetLevel: number
): { allowed: boolean; reason?: string } {
  // 关卡范围校验
  if (targetLevel < 1 || targetLevel > 10) {
    return { allowed: false, reason: "关卡不存在（范围1-10）" };
  }

  // 规则1：必须按顺序解锁（不能跨关）
  if (targetLevel > 1) {
    const prevLevel = targetLevel - 1;
    if (!journey.completedLevels.includes(prevLevel)) {
      return {
        allowed: false,
        reason: `请先完成第${prevLevel}关「${LEVEL_NAMES[prevLevel]}」`,
      };
    }
  }

  // 规则2：第3关以后必须完成第1-2关
  if (targetLevel >= 3) {
    if (!journey.completedLevels.includes(1) || !journey.completedLevels.includes(2)) {
      return {
        allowed: false,
        reason: "请先完成第1-2关（安全力觉醒是后续关卡的基础）",
      };
    }
  }

  // 规则3：第9关是安全审核强制节点
  if (targetLevel === 9) {
    // 第9关本身可以进入，但它的完成条件包含安全检查
    // 这里不做额外限制，只需前8关完成即可进入
  }

  // 规则4：第10关必须第9关安全审核通过
  if (targetLevel === 10) {
    if (!journey.completedLevels.includes(9)) {
      return {
        allowed: false,
        reason: "请先完成第9关「影响力」（含安全审核）",
      };
    }
    // 第9关通过后 publishStatus 应该已变为 REVIEWING
    if (journey.publishStatus !== "REVIEWING" && journey.publishStatus !== "APPROVED") {
      return {
        allowed: false,
        reason: "请先通过第9关安全审核",
      };
    }
  }

  return { allowed: true };
}

// ═══════════════════════════════════════════════════════════════════
// 关卡产出校验
// ═══════════════════════════════════════════════════════════════════

/**
 * 校验关卡产出是否满足完成条件
 * 使用 level-configs 中定义的 validationSchema
 */
export function validateLevelCompletion(
  level: number,
  output: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  return validateLevelOutput(level, output);
}

// ═══════════════════════════════════════════════════════════════════
// 关卡完成 & 状态推进
// ═══════════════════════════════════════════════════════════════════

/**
 * 完成一关并推进到下一关
 *
 * 流程：
 * 1. 查询当前旅程
 * 2. 校验能否推进（canAdvanceToLevel）
 * 3. 校验产出是否满足完成条件（validateLevelCompletion）
 * 4. 计算下一关的 power
 * 5. 处理 publishStatus 转移（第9关通过 → DRAFT → REVIEWING）
 * 6. 事务：更新 Journey + 写 JourneyLog
 *
 * @returns 更新后的 Journey
 * @throws 当校验不通过时抛出错误
 */
export async function advanceLevel(
  journeyId: string,
  completedLevel: number,
  output: Record<string, unknown>
): Promise<Journey> {
  const journey = await prisma.journey.findUniqueOrThrow({
    where: { id: journeyId },
  });

  // 1. 检查是否已在当前关卡
  if (journey.currentLevel !== completedLevel) {
    // 允许重新提交已完成关卡的情况（但不推进）
    if (journey.completedLevels.includes(completedLevel)) {
      // 已完成的关卡只做保存，不推进
      return saveLevelOutput(journeyId, completedLevel, output);
    }
    throw new Error(
      `当前在第${journey.currentLevel}关，不能提交第${completedLevel}关`
    );
  }

  // 2. 前置条件校验
  const advanceCheck = canAdvanceToLevel(journey, completedLevel);
  if (!advanceCheck.allowed) {
    throw new Error(advanceCheck.reason);
  }

  // 3. 产出校验
  const outputCheck = validateLevelCompletion(completedLevel, output);
  if (!outputCheck.valid) {
    throw new Error(`关卡产出不满足完成条件：${outputCheck.errors.join("；")}`);
  }

  // 4. 计算下一关
  const nextLevel = completedLevel < 10 ? completedLevel + 1 : 10;
  const nextPower = LEVEL_TO_POWER[nextLevel];

  // 5. publishStatus 转移
  let publishStatus: $Enums.PublishStatus = journey.publishStatus;
  if (completedLevel === 9) {
    // 第9关通过后，从 DRAFT → REVIEWING（安全审核通过才能发布）
    if (journey.publishStatus === "DRAFT") {
      publishStatus = "REVIEWING";
    }
  }

  // 6. 事务更新
  const [updatedJourney] = await prisma.$transaction([
    prisma.journey.update({
      where: { id: journeyId },
      data: {
        completedLevels: { push: completedLevel },
        currentLevel: nextLevel,
        currentPower: nextPower,
        publishStatus,
        ...output,
        updatedAt: new Date(),
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
        metadata: {
          outputKeys: Object.keys(output),
          completedLevelsAfter: [...journey.completedLevels, completedLevel],
        },
      },
    }),
  ]);

  return updatedJourney;
}

// ═══════════════════════════════════════════════════════════════════
// 关卡保存（不推进）
// ═══════════════════════════════════════════════════════════════════

/**
 * 保存当前关卡字段（不推进状态）
 * 用于断点续填场景
 */
export async function saveLevelOutput(
  journeyId: string,
  level: number,
  output: Record<string, unknown>
): Promise<Journey> {
  return prisma.journey.update({
    where: { id: journeyId },
    data: {
      ...output,
      updatedAt: new Date(),
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
// publishStatus 状态转移
// ═══════════════════════════════════════════════════════════════════

/**
 * 合法的 publishStatus 转移路径：
 *
 *   DRAFT ──→ REVIEWING   （第9关通过）
 *   REVIEWING ──→ APPROVED （运营审核通过 + 家长确认）
 *   REVIEWING ──→ REJECTED （运营审核驳回）
 *   REJECTED ──→ REVIEWING （修改后重新提交）
 *   REJECTED ──→ DRAFT     （回到草稿修改）
 *
 * 不允许的转移：
 *   DRAFT ──→ APPROVED     （必须先过第9关审核）
 *   APPROVED ──→ *         （终态，不可回退）
 */
const ALLOWED_PUBLISH_TRANSITIONS: Record<$Enums.PublishStatus, $Enums.PublishStatus[]> = {
  DRAFT: ["REVIEWING"],
  REVIEWING: ["APPROVED", "REJECTED"],
  REJECTED: ["REVIEWING", "DRAFT"],
  APPROVED: [], // 终态
};

/**
 * 检查 publishStatus 转移是否合法
 */
export function canTransitionPublishStatus(
  from: $Enums.PublishStatus,
  to: $Enums.PublishStatus
): { allowed: boolean; reason?: string } {
  const allowed = ALLOWED_PUBLISH_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    return {
      allowed: false,
      reason: `不允许从 ${from} 转移到 ${to}`,
    };
  }

  // 特殊规则：DRAFT → REVIEWING 只有在第9关通过后才允许
  if (from === "DRAFT" && to === "REVIEWING") {
    // 调用方需额外校验第9关是否完成
  }

  return { allowed: true };
}

/**
 * 转移 publishStatus
 * 含前置校验
 */
export async function transitionPublishStatus(
  journeyId: string,
  newStatus: $Enums.PublishStatus
): Promise<Journey> {
  const journey = await prisma.journey.findUniqueOrThrow({
    where: { id: journeyId },
  });

  const check = canTransitionPublishStatus(journey.publishStatus, newStatus);
  if (!check.allowed) {
    throw new Error(check.reason);
  }

  // DRAFT → REVIEWING：必须完成第9关
  if (journey.publishStatus === "DRAFT" && newStatus === "REVIEWING") {
    if (!journey.completedLevels.includes(9)) {
      throw new Error("必须先完成第9关安全审核");
    }
  }

  // REVIEWING → APPROVED：必须有家长确认
  if (journey.publishStatus === "REVIEWING" && newStatus === "APPROVED") {
    if (!journey.parentConfirm) {
      throw new Error("必须获得家长确认后才能发布");
    }
  }

  const [updatedJourney] = await prisma.$transaction([
    prisma.journey.update({
      where: { id: journeyId },
      data: {
        publishStatus: newStatus,
        updatedAt: new Date(),
      },
    }),
    prisma.journeyLog.create({
      data: {
        journeyId,
        fromLevel: journey.currentLevel,
        toLevel: journey.currentLevel,
        fromPower: journey.currentPower,
        toPower: journey.currentPower,
        trigger: `publish_status_change:${journey.publishStatus}->${newStatus}`,
        metadata: { oldStatus: journey.publishStatus, newStatus },
      },
    }),
  ]);

  return updatedJourney;
}

// ═══════════════════════════════════════════════════════════════════
// 红灯记录
// ═══════════════════════════════════════════════════════════════════

/**
 * 记录安全红灯事件
 * 触发时立即调用，写入 journey.safetyFlags
 */
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
    context: context.slice(0, 200), // 只存前200字，保护隐私
    timestamp: new Date().toISOString(),
  });

  await prisma.journey.update({
    where: { id: journeyId },
    data: { safetyFlags: flags },
  });
}

// ═══════════════════════════════════════════════════════════════════
// 家长确认
// ═══════════════════════════════════════════════════════════════════

/**
 * 家长确认发布
 * 第10关发布闸口必须经过家长确认
 */
export async function confirmByParent(
  journeyId: string,
  parentId: string
): Promise<Journey> {
  const journey = await prisma.journey.findUniqueOrThrow({
    where: { id: journeyId },
    include: { child: { select: { parentId: true } } },
  });

  // 校验家长身份
  if (journey.child.parentId !== parentId) {
    throw new Error("此家长无权确认该旅程");
  }

  // 校验旅程状态
  if (journey.publishStatus !== "REVIEWING") {
    throw new Error("仅审核中的作品可以确认发布");
  }

  if (journey.parentConfirm) {
    throw new Error("家长已确认，无需重复操作");
  }

  const [updatedJourney] = await prisma.$transaction([
    prisma.journey.update({
      where: { id: journeyId },
      data: {
        parentConfirm: true,
        updatedAt: new Date(),
      },
    }),
    prisma.journeyLog.create({
      data: {
        journeyId,
        fromLevel: journey.currentLevel,
        toLevel: journey.currentLevel,
        fromPower: journey.currentPower,
        toPower: journey.currentPower,
        trigger: "parent_confirm",
        metadata: { parentId },
      },
    }),
  ]);

  return updatedJourney;
}

// ═══════════════════════════════════════════════════════════════════
// 旅程创建
// ═══════════════════════════════════════════════════════════════════

/**
 * 创建新旅程
 * 初始化状态：第1关、安全力、DRAFT
 */
export async function createJourney(childId: string): Promise<Journey> {
  return prisma.journey.create({
    data: {
      childId,
      currentPower: "SAFETY",
      currentLevel: 1,
      completedLevels: [],
      publishStatus: "DRAFT",
      safetyFlags: [],
      parentConfirm: false,
    },
  });
}

/**
 * 查询旅程完整状态
 */
export async function getJourneyState(journeyId: string) {
  return prisma.journey.findUnique({
    where: { id: journeyId },
    include: {
      child: {
        select: {
          id: true,
          anonymousName: true,
          ageStage: true,
          parentId: true,
        },
      },
      conversations: {
        orderBy: { createdAt: "desc" },
        take: 20, // 最近20条对话
      },
      work: true,
      badge: true,
    },
  });
}
