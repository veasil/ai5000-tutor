// src/lib/journey/level-configs.ts
// 十关配置：每关的任务定义、输出字段、验证规则、解锁条件
// 与 spec v2（13页演练文档）对齐

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════
// 关卡模板类型
// ═══════════════════════════════════════════════════════════════════

/** 关卡交互模板（A/B/C/D 四套） */
export type LevelTemplate = "A" | "B" | "C" | "D";

// ═══════════════════════════════════════════════════════════════════
// 关卡配置接口
// ═══════════════════════════════════════════════════════════════════

export interface LevelConfig {
  /** 关卡号 1-10 */
  level: number;
  /** 关卡名称 */
  name: string;
  /** 所属五力 */
  power: "SAFETY" | "BRAINWAVE" | "SENSING" | "CREATIVITY" | "COMMUNICATION";
  /** 关卡描述 */
  description: string;
  /** 交互模板类型 */
  template: LevelTemplate;
  /** 该关核心产出字段名列表（对应 Journey 表字段） */
  outputFields: string[];
  /** Zod 校验 schema（判定是否完成） */
  validationSchema: z.ZodTypeAny;
  /** 解锁条件描述 */
  unlockCondition: string;
  /** 是否有少年版差异 */
  hasYouthDiff: boolean;
  /** 少年版差异说明 */
  youthDiff?: string;
  /** 小伍开场文案 */
  openingLine: string;
  /** 注入依赖（来自前面关卡产出） */
  injectsFrom: number[]; // 依赖哪些关卡的产出
}

// ═══════════════════════════════════════════════════════════════════
// 十关完整配置
// ═══════════════════════════════════════════════════════════════════

export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  // ── 第1关 · 小伍风险冒险局 ─────────────────────────────────────
  1: {
    level: 1,
    name: "小伍风险冒险局",
    power: "SAFETY",
    description: "识别风险，通过卡牌答题发现最关心的数字风险，收敛出 Top 3 问题",
    template: "A",
    outputFields: [
      "entryChoice",      // 入口选择：推荐/自带点子
      "ideaText",         // 自带点子（可选）
      "powerScores",      // 五力了解度自评
      "cardsPlayed",      // 答题记录
      "top3Concerns",     // 关心问题 Top 3
      "wqtSessionId",     // WQT game_sessions.id
      "wqtReviewSnapshot", // WQT 复盘快照
      "wqtReviewReportUrl", // WQT 复盘网页
    ],
    validationSchema: z.object({
      wqtSessionId: z.string().min(1, "必须关联 WQT 对局"),
      wqtReviewSnapshot: z.unknown(),
      cardsPlayed: z.array(z.unknown()).min(6, "至少完成6张答题卡"),
      top3Concerns: z.array(z.string()).length(3, "必须选定3个关心问题"),
    }),
    unlockCondition: "旅程开始即可进入",
    hasYouthDiff: true,
    youthDiff: "仅卡池不同（少年版用更简单的风险情景卡）",
    openingLine: "先选一条路——",
    injectsFrom: [],
  },

  // ── 第2关 · 责任议题锁定 ──────────────────────────────────────
  2: {
    level: 2,
    name: "责任议题锁定",
    power: "SAFETY",
    description: "从 Top 3 中选定一个责任议题，五维自评其价值，低分追问",
    template: "A",
    outputFields: [
      "threeIssueEvals",        // 三议题五维自评
      "lowScoreFollowUps",      // 低分追问记录
      "systemRecommendation",   // 系统推荐
      "selectedIssue",          // 最终选择
      "selectedIssueIndex",     // 选择索引
    ],
    validationSchema: z.object({
      threeIssueEvals: z.array(z.unknown()).length(3, "三个议题都要完成五维自评"),
      selectedIssue: z.string().min(1, "必须锁定一个议题"),
    }),
    unlockCondition: "完成第1关",
    hasYouthDiff: false,
    openingLine: "你锁定了这3个问题，我们来挑一个真正想做的。",
    injectsFrom: [1], // 注入 top3Concerns
  },

  // ── 第3关 · 实感力启动 ────────────────────────────────────────
  3: {
    level: 3,
    name: "实感力启动",
    power: "SENSING",
    description: "用四种调研方法取材，把议题落回真实经历，生成实感故事卡",
    template: "A",
    outputFields: [
      "protagonist",      // 主角
      "plot",             // 情节
      "evidence",         // 证据
      "materialSources",  // 素材来源
    ],
    validationSchema: z.object({
      protagonist: z.string().min(1, "必须有主角"),
      plot: z.string().min(10, "情节不能太短"),
      evidence: z.string().min(1, "至少有一条证据"),
    }),
    unlockCondition: "完成第2关",
    hasYouthDiff: false,
    openingLine: "好点子要长在真实的事上。先想想关于这个议题——你关注过什么？经历过什么？",
    injectsFrom: [2], // 注入 selectedIssue
  },

  // ── 第4关 · 问题侦探局 ────────────────────────────────────────
  4: {
    level: 4,
    name: "问题侦探局",
    power: "SENSING",
    description: "深挖根源，追问牵涉的人/为何没解决/谁试过，生成冰山图",
    template: "A",
    outputFields: [
      "surfaceDescription",   // 表象
      "stakeholders",         // 牵涉了谁
      "rootCauses",           // 根源
      "previousAttempts",     // 谁试过
      "entryWindow",          // 切入窗口
    ],
    validationSchema: z.object({
      surfaceDescription: z.string().min(1, "必须描述表象"),
      stakeholders: z.array(z.string()).min(1, "至少列出1个牵涉方"),
      rootCauses: z.array(z.string()).min(1, "至少分析1个根源"),
      entryWindow: z.string().min(1, "必须选定切入窗口"),
    }),
    unlockCondition: "完成第3关",
    hasYouthDiff: false,
    openingLine: "这件事，除了主角，还牵动着谁？",
    injectsFrom: [3], // 注入实感故事卡
  },

  // ── 第5关 · AI机制拆解局 ──────────────────────────────────────
  5: {
    level: 5,
    name: "AI机制拆解局",
    power: "BRAINWAVE",
    description: "认识人机交互全景与边界，拆解议题的多重AI机制",
    template: "A",
    outputFields: [
      "mechanismDescription",  // 机制描述
      "aiCanDo",               // AI 能做的
      "aiCannotDo",            // AI 不能做的
      "analogyDescription",    // 少年版比喻（可选）
    ],
    validationSchema: z.object({
      mechanismDescription: z.string().min(10, "至少写一段机制描述"),
      aiCanDo: z.array(z.string()).min(1, "至少列出1项AI能做的"),
      aiCannotDo: z.array(z.string()).min(1, "至少列出1项AI不能做的"),
    }),
    unlockCondition: "完成第4关",
    hasYouthDiff: true,
    youthDiff: "Step①只看3-4种常见AI；Step③作业改为打比方描述机制",
    openingLine: "AI已经悄悄在很多地方影响我们了，一起看看。",
    injectsFrom: [2, 4], // 注入议题卡 + 切入窗口
  },

  // ── 第6关 · AI共创准备站 ──────────────────────────────────────
  6: {
    level: 6,
    name: "AI共创准备站",
    power: "BRAINWAVE",
    description: "掌握人机协作流程与最佳实践，合成开工清单",
    template: "A",
    outputFields: [
      "modules",                  // 五模块作业（青年版）
      "simplifiedModules",        // 三模块作业（少年版）
      "collaborationChecklist",   // 协作流程
      "safetyItems",              // 安全项
      "ethicsItems",              // 伦理项
    ],
    validationSchema: z.object({
      collaborationChecklist: z.array(z.string()).min(1, "协作流程不能为空"),
      safetyItems: z.array(z.string()).min(1, "安全项不能为空"),
      ethicsItems: z.array(z.string()).min(1, "伦理项不能为空"),
    }),
    unlockCondition: "完成第5关",
    hasYouthDiff: true,
    youthDiff: "模块精简为3块：Prompt模板+安全铁律+伦理提醒",
    openingLine: "想不起来也没关系，挑几种方式去'取材'。",
    injectsFrom: [5], // 注入机制拆解 + 能不能清单
  },

  // ── 第7关 · 愿景与方法站 ──────────────────────────────────────
  7: {
    level: 7,
    name: "愿景与方法站",
    power: "CREATIVITY",
    description: "愿景、ABC技术画布、Demo规划、Effect效果验证",
    template: "A",
    outputFields: [
      "vision",               // 愿景
      "aiAction",             // AI Action
      "abcCanvas",            // ABC 技术画布
      "demoPlan",             // Demo 规划
      "effectVerification",   // 效果验证
    ],
    validationSchema: z.object({
      vision: z.string().min(1, "必须写愿景"),
      abcCanvas: z.object({
        A_awareness: z.string().min(1, "ABC三格必须填满"),
        B_behavior: z.string().min(1, "ABC三格必须填满"),
        C_result: z.string().min(1, "ABC三格必须填满"),
      }),
      demoPlan: z.string().min(1, "必须有Demo规划"),
    }),
    unlockCondition: "完成第6关",
    hasYouthDiff: false,
    openingLine: "想象一下，你的东西做出来后，世界哪里变好了一点点？",
    injectsFrom: [2, 4, 5, 6], // 注入议题+切入窗口+机制+清单
  },

  // ── 第8关 · Demo工坊 ──────────────────────────────────────────
  8: {
    level: 8,
    name: "Demo工坊",
    power: "CREATIVITY",
    description: "本地vibe coding + EdgeOne MCP一键部署 + 两强制checkpoint",
    template: "B",
    outputFields: [
      "demoUrl",               // Demo URL
      "iterations",            // 迭代记录
      "responsibilityReview",  // 责任审查
      "engineeringCheckpoint", // 工程审查完成
      "bodyRelaxCheckpoint",   // 身体放松完成
      "edgeOneAssetId",        // EdgeOne 资产 ID
    ],
    validationSchema: z.object({
      demoUrl: z.string().url("必须提交有效的Demo URL"),
      iterations: z.array(z.unknown()).min(1, "至少完成1次迭代"),
      engineeringCheckpoint: z.literal(true, { message: "工程审查必须完成" }),
      bodyRelaxCheckpoint: z.literal(true, { message: "身体放松必须完成" }),
    }),
    unlockCondition: "完成第7关",
    hasYouthDiff: false,
    openingLine: "这一关，你要在自己电脑上，亲手把它做出来。我给你配一套最省事的工具。",
    injectsFrom: [6, 7], // 注入方案蓝图 + 第6关清单
  },

  // ── 第9关 · 影响力 ────────────────────────────────────────────
  9: {
    level: 9,
    name: "影响力",
    power: "COMMUNICATION",
    description: "设计真实/传播/持续三层影响力，也是安全审核强制节点",
    template: "C",
    outputFields: [
      "realImpact",            // 真实影响力
      "spreadImpact",          // 传播影响力
      "slogan",                // slogan
      "sustainedImpact",       // 持续影响力（商业闭环，少年版可省）
      "stakeholderAnalysis",   // 利益相关方分析
      "safetyReport",          // 责任检查报告（系统生成）
    ],
    validationSchema: z.object({
      realImpact: z.string().min(5, "真实影响力不能太短"),
      spreadImpact: z.string().min(1, "传播影响力不能为空"),
      slogan: z.string().min(1, "必须有slogan"),
    }),
    unlockCondition: "完成第8关",
    hasYouthDiff: true,
    youthDiff: "只留真实影响力+一句slogan，去掉商业闭环",
    openingLine: "作品有了，接下来让更多人看见它的价值。我们分三层来——",
    injectsFrom: [8], // 注入 Demo
  },

  // ── 第10关 · 小伍创客发布会 ───────────────────────────────────
  10: {
    level: 10,
    name: "小伍创客发布会",
    power: "COMMUNICATION",
    description: "录制发布会视频、生成作品卡、过发布闸口、点亮徽章",
    template: "D",
    outputFields: [
      "publishScript",         // 发布会脚本
      "videoUrl",              // 录制视频
      "workCardGenerated",     // 作品卡已生成
      "allChecksPassed",       // 发布闸口通过
      "parentConfirmed",       // 家长确认
    ],
    validationSchema: z.object({
      publishScript: z.object({
        problem: z.string().min(1),
        solution: z.string().min(1),
        audience: z.string().min(1),
      }),
      videoUrl: z.string().min(1, "必须录制视频"),
      allChecksPassed: z.literal(true, { message: "发布闸口必须全部通过" }),
      parentConfirmed: z.literal(true, { message: "必须获得家长确认" }),
    }),
    unlockCondition: "完成第9关且通过安全审核",
    hasYouthDiff: false,
    openingLine: "最后一步，把你的作品讲给世界听！我帮你搭个稿子。",
    injectsFrom: [8, 9], // 注入 Demo + 影响力方案
  },
};

// ═══════════════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════════════

/** 获取关卡配置 */
export function getLevelConfig(level: number): LevelConfig {
  const config = LEVEL_CONFIGS[level];
  if (!config) {
    throw new Error(`关卡 ${level} 不存在`);
  }
  return config;
}

/** 校验关卡产出是否满足完成条件 */
export function validateLevelOutput(
  level: number,
  output: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const config = LEVEL_CONFIGS[level];
  if (!config) {
    return { valid: false, errors: [`关卡 ${level} 不存在`] };
  }

  const result = config.validationSchema.safeParse(output);
  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );
  return { valid: false, errors };
}

/** 获取关卡名称 */
export function getLevelName(level: number): string {
  return LEVEL_CONFIGS[level]?.name ?? `第${level}关`;
}

/** 获取某五力下的所有关卡号 */
export function getLevelsByPower(
  power: "SAFETY" | "BRAINWAVE" | "SENSING" | "CREATIVITY" | "COMMUNICATION"
): number[] {
  return Object.values(LEVEL_CONFIGS)
    .filter((c) => c.power === power)
    .map((c) => c.level)
    .sort((a, b) => a - b);
}

/** 获取关卡的注入依赖（需要哪些关卡的产出作为输入） */
export function getLevelInjects(level: number): number[] {
  return LEVEL_CONFIGS[level]?.injectsFrom ?? [];
}

/** 少年版是否需要特殊处理 */
export function isLevelSimplified(level: number, ageStage: string): boolean {
  const config = LEVEL_CONFIGS[level];
  if (!config?.hasYouthDiff) return false;
  // 启蒙期和成长期走少年版减负
  return ageStage === "ENLIGHTENMENT" || ageStage === "GROWTH";
}
