// src/types/index.ts
// 全局类型定义（与 Prisma schema 对齐）
// Zod schema 同时用于 Server Action 入参校验、前端表单校验、AI 结构化输出 parse

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════
// 枚举类型
// ═══════════════════════════════════════════════════════════════════

/** 五力框架 */
export const FivePowerSchema = z.enum([
  "SAFETY",        // 安全力觉醒
  "BRAINWAVE",     // 脑波力启蒙
  "SENSING",       // 实感力锻造
  "CREATIVITY",    // 创心力迸发
  "COMMUNICATION", // 沟通力绽放
]);
export type FivePower = z.infer<typeof FivePowerSchema>;

/** 旅程状态 */
export const JourneyStatusSchema = z.enum([
  "ACTIVE",     // 进行中
  "COMPLETED",  // 已通关
  "ABANDONED",  // 已放弃
]);
export type JourneyStatus = z.infer<typeof JourneyStatusSchema>;

/** 发布状态 */
export const PublishStatusSchema = z.enum([
  "DRAFT",     // 草稿
  "REVIEWING", // 审核中（第9关通过后才能进入）
  "APPROVED",  // 审核通过
  "REJECTED",  // 审核驳回
]);
export type PublishStatus = z.infer<typeof PublishStatusSchema>;

/** 年龄段 */
export const AgeStageSchema = z.enum([
  "ENLIGHTENMENT", // 启蒙期 6-8岁
  "GROWTH",        // 成长期 9-12岁
  "YOUTH",         // 青春期 13-15岁
]);
export type AgeStage = z.infer<typeof AgeStageSchema>;

/** 游玩模式 */
export const PlayModeSchema = z.enum([
  "OBSERVER",  // 小小观察员 6-8岁
  "CREATOR",   // AI创想家 9-12岁
  "DEVELOPER", // 负责任开发者 13-15岁
  "FAMILY",    // 家庭共创
]);
export type PlayMode = z.infer<typeof PlayModeSchema>;

/** 孩子身份（能量判定用） */
export const ChildIdentitySchema = z.enum([
  "MEMBER", // 创客营成员
  "GUEST",  // 游客
]);
export type ChildIdentity = z.infer<typeof ChildIdentitySchema>;

/** 红灯类型 */
export const SafetyFlagTypeSchema = z.enum([
  "self_harm",          // 自伤/自杀
  "threat",             // 被威胁
  "pii",                // 个人隐私信息
  "credentials",        // 账号密码
  "api_key",            // API 密钥
  "unauthorized_media", // 未授权素材
]);
export type SafetyFlagType = z.infer<typeof SafetyFlagTypeSchema>;

/** 审核结果 */
export const ReviewDecisionSchema = z.enum(["APPROVE", "REJECT"]);
export type ReviewDecision = z.infer<typeof ReviewDecisionSchema>;

// ═══════════════════════════════════════════════════════════════════
// Server Action 统一返回格式
// ═══════════════════════════════════════════════════════════════════

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

// ═══════════════════════════════════════════════════════════════════
// 每关产出类型 (Level Output)
// 与 Prisma schema 的 Journey 字段对齐
// ═══════════════════════════════════════════════════════════════════

// ── 第1关 · 小伍风险冒险局 ──────────────────────────────────────────

/** 五力分数（滑条自评） */
export const PowerScoresSchema = z.object({
  bodySafety: z.number().min(1).max(5),    // 身体安全
  mentalSafety: z.number().min(1).max(5),   // 心理安全
  socialSafety: z.number().min(1).max(5),  // 社交安全
  economicSafety: z.number().min(1).max(5), // 经济安全
  digitalRights: z.number().min(1).max(5), // 数字权益
});
export type PowerScores = z.infer<typeof PowerScoresSchema>;

/** 卡牌答题记录 */
export const CardPlayRecordSchema = z.object({
  cardId: z.string(),
  selectedOption: z.enum(["A", "B", "C", "D"]),
  customOption: z.string().optional(), // D 选项自创内容
  powerChanges: z.record(z.string(), z.number()), // 如 { "安全力": 1, "实感力": -1 }
});
export type CardPlayRecord = z.infer<typeof CardPlayRecordSchema>;

/** WQT 复盘快照（来源：wqt-auth-backend game_sessions + game_events） */
export const WqtReviewSnapshotSchema = z.object({
  session: z.record(z.string(), z.unknown()),
  cards: z.array(z.record(z.string(), z.unknown())),
  skills: z.array(z.record(z.string(), z.unknown())).optional(),
  durationMs: z.number().nullable().optional(),
}).passthrough();
export type WqtReviewSnapshot = z.infer<typeof WqtReviewSnapshotSchema>;

export const Level1OutputSchema = z.object({
  entryChoice: z.enum(["RECOMMEND", "IDEA"]),   // 入口选择
  ideaText: z.string().optional(),                // 自带点子内容
  powerScores: PowerScoresSchema.optional(),      // 旧版自评字段；WQT 接入后可由快照派生
  cardsPlayed: z.array(CardPlayRecordSchema).min(6), // 至少6张答题
  top3Concerns: z.array(z.string()).length(3),    // 关心问题 Top 3
  wqtSessionId: z.string().min(1),                // WQT game_sessions.id
  wqtReviewSnapshot: WqtReviewSnapshotSchema,     // WQT 复盘数据快照
  wqtReviewReportUrl: z.string().url().optional(), // WQT 复盘网页
});
export type Level1Output = z.infer<typeof Level1OutputSchema>;

// ── 第2关 · 责任议题锁定 ──────────────────────────────────────────

/** 单个议题五维自评 */
export const IssueFiveDimSchema = z.object({
  resonance: z.number().min(1).max(5),    // 共振：我足够被它触动
  responsibility: z.number().min(1).max(5), // 责任：我足够愿意负责
  originality: z.number().min(1).max(5),  // 原创：我足够想用自己的方式
  embeddedness: z.number().min(1).max(5), // 嵌入：足够连着真实的人
  feasibility: z.number().min(1).max(5),  // 可行：我足够能把它做出来
});
export type IssueFiveDim = z.infer<typeof IssueFiveDimSchema>;

/** 低分追问记录 */
export const LowScoreFollowUpSchema = z.object({
  dimension: z.string(),
  score: z.number(),
  question: z.string(),   // 小伍的追问
  answer: z.string(),     // 孩子的回答
});
export type LowScoreFollowUp = z.infer<typeof LowScoreFollowUpSchema>;

export const Level2OutputSchema = z.object({
  threeIssueEvals: z.array(z.object({
    issue: z.string(),
    fiveDim: IssueFiveDimSchema,
    followUps: z.array(LowScoreFollowUpSchema),
  })).length(3),
  systemRecommendation: z.string(),        // 系统推荐（共振x可行最优）
  selectedIssue: z.string(),               // 最终选择
  selectedIssueIndex: z.number().min(0).max(2),
});
export type Level2Output = z.infer<typeof Level2OutputSchema>;

// ── 第3关 · 实感力启动 ──────────────────────────────────────────

/** 调研素材记录 */
export const ResearchMaterialSchema = z.object({
  method: z.enum(["MEMORY", "PEER", "COMMUNITY", "INTERNET"]), // 四种调研方法
  content: z.string(),            // 录入内容
  followUps: z.array(z.object({   // 写死追问
    round: z.number(),            // 1=细节, 2=证据, 3=深度
    question: z.string(),
    answer: z.string(),
  })),
});

export const Level3OutputSchema = z.object({
  protagonist: z.string(),                    // 主角
  plot: z.string(),                           // 情节
  evidence: z.string(),                       // 证据
  materialSources: z.array(ResearchMaterialSchema).min(1), // 至少1种调研
});
export type Level3Output = z.infer<typeof Level3OutputSchema>;

// ── 第4关 · 问题侦探局 ──────────────────────────────────────────

export const Level4OutputSchema = z.object({
  surfaceDescription: z.string(),             // 表象（大家看到的）
  stakeholders: z.array(z.string()).min(1),   // 牵涉了谁
  rootCauses: z.array(z.string()).min(1),     // 为何没解决
  previousAttempts: z.array(z.object({        // 谁试过
    who: z.string(),
    what: z.string(),
    whyFailed: z.string(),
  })),
  entryWindow: z.string(),                    // 切入窗口
});
export type Level4Output = z.infer<typeof Level4OutputSchema>;

// ── 第5关 · AI机制拆解局 ──────────────────────────────────────────

export const Level5OutputSchema = z.object({
  mechanismDescription: z.string().min(10),   // 议题机制描述（开放）
  aiCanDo: z.array(z.string()).min(1),        // AI 能做的
  aiCannotDo: z.array(z.string()).min(1),     // AI 不能做的
  // 少年版专用：比喻描述
  analogyDescription: z.string().optional(),
});
export type Level5Output = z.infer<typeof Level5OutputSchema>;

// ── 第6关 · AI共创准备站 ──────────────────────────────────────────

/** 单个模块作业 */
export const ModuleAssignmentSchema = z.object({
  moduleId: z.enum(["PROMPT", "TEST", "MODULAR", "SECURITY", "ETHICS"]),
  content: z.string(),  // 作业内容
});

/** 精简版模块（少年版） */
export const SimplifiedModuleAssignmentSchema = z.object({
  moduleId: z.enum(["PROMPT_TEMPLATE", "SAFETY_RULE", "ETHICS_REMINDER"]),
  content: z.string(),
});

export const Level6OutputSchema = z.object({
  modules: z.array(ModuleAssignmentSchema).min(5), // 五模块全部完成
  simplifiedModules: z.array(SimplifiedModuleAssignmentSchema).min(3).optional(), // 少年版三模块
  collaborationChecklist: z.array(z.string()).min(1), // 协作流程
  safetyItems: z.array(z.string()).min(1),             // 安全项
  ethicsItems: z.array(z.string()).min(1),             // 伦理项
});
export type Level6Output = z.infer<typeof Level6OutputSchema>;

// ── 第7关 · 愿景与方法站 ──────────────────────────────────────────

/** ABC 技术画布 */
export const ABCCanvasSchema = z.object({
  A_awareness: z.string(),   // A 意识唤醒
  B_behavior: z.string(),    // B 行为干预
  C_result: z.string(),      // C 结果验证
});

export const Level7OutputSchema = z.object({
  vision: z.string(),                          // 愿景一句话
  aiAction: z.string(),                        // AI Action
  abcCanvas: ABCCanvasSchema,                  // ABC 技术画布
  demoPlan: z.string(),                        // Demo 规划
  effectVerification: z.string(),              // 效果验证标准
  responsibilityDecision: z.string().optional(), // 中途责任决策点记录
});
export type Level7Output = z.infer<typeof Level7OutputSchema>;

// ── 第8关 · Demo工坊 ──────────────────────────────────────────

/** 迭代记录 */
export const IterationRecordSchema = z.object({
  version: z.number(),
  changes: z.string(),
  testResult: z.string(),
  responsibilityNote: z.string().optional(), // 责任审查记录
});

export const Level8OutputSchema = z.object({
  demoUrl: z.string().url(),                   // Demo URL（EdgeOne 部署后）
  iterations: z.array(IterationRecordSchema).min(1), // 至少1次迭代
  responsibilityReview: z.string(),             // 责任审查总记录
  engineeringCheckpoint: z.boolean(),           // 工程审查完成
  bodyRelaxCheckpoint: z.boolean(),             // 身体放松完成
  edgeOneAssetId: z.string().optional(),        // EdgeOne 资产 ID
});
export type Level8Output = z.infer<typeof Level8OutputSchema>;

// ── 第9关 · 影响力 ──────────────────────────────────────────

export const Level9OutputSchema = z.object({
  realImpact: z.string(),                      // 真实影响力
  spreadImpact: z.string(),                    // 传播影响力
  slogan: z.string(),                          // slogan
  sustainedImpact: z.string().optional(),      // 持续影响力（商业闭环，少年版可省）
  stakeholderAnalysis: z.string().optional(),  // 利益相关方分析
  safetyReport: z.record(z.unknown()).optional(), // 责任检查报告（系统生成）
});
export type Level9Output = z.infer<typeof Level9OutputSchema>;

// ── 第10关 · 小伍创客发布会 ──────────────────────────────────────────

/** 发布会脚本 */
export const PublishScriptSchema = z.object({
  problem: z.string(),   // 我看到__
  solution: z.string(),  // 所以我做了__
  audience: z.string(),  // 它能帮__
});

export const Level10OutputSchema = z.object({
  publishScript: PublishScriptSchema, // 发布会脚本
  videoUrl: z.string(),                // 录制视频 URL
  workCardGenerated: z.boolean(),      // 作品卡已生成
  allChecksPassed: z.boolean(),        // 发布闸口通过
  parentConfirm: z.boolean(),          // 家长确认
});
export type Level10Output = z.infer<typeof Level10OutputSchema>;

// ═══════════════════════════════════════════════════════════════════
// 统一 LevelOutput 联合类型（按关卡号索引）
// ═══════════════════════════════════════════════════════════════════

export const LevelOutputSchemaMap = {
  1: Level1OutputSchema,
  2: Level2OutputSchema,
  3: Level3OutputSchema,
  4: Level4OutputSchema,
  5: Level5OutputSchema,
  6: Level6OutputSchema,
  7: Level7OutputSchema,
  8: Level8OutputSchema,
  9: Level9OutputSchema,
  10: Level10OutputSchema,
} as const;

export type LevelOutputMap = {
  1: Level1Output;
  2: Level2Output;
  3: Level3Output;
  4: Level4Output;
  5: Level5Output;
  6: Level6Output;
  7: Level7Output;
  8: Level8Output;
  9: Level9Output;
  10: Level10Output;
};

export type LevelOutput = LevelOutputMap[keyof LevelOutputMap];

// ═══════════════════════════════════════════════════════════════════
// API Request / Response 类型
// ═══════════════════════════════════════════════════════════════════

// ── Auth ────────────────────────────────────────────────────────────

export const AnonymousLoginRequestSchema = z.object({
  ageStage: AgeStageSchema,
  playMode: PlayModeSchema.optional(),
});
export type AnonymousLoginRequest = z.infer<typeof AnonymousLoginRequestSchema>;

export const AnonymousLoginResponseSchema = z.object({
  childId: z.string(),
  anonymousName: z.string(),  // 格式：小伍创客XXXX
  token: z.string(),
});
export type AnonymousLoginResponse = z.infer<typeof AnonymousLoginResponseSchema>;

// ── Journey ─────────────────────────────────────────────────────────

export const JourneyStartRequestSchema = z.object({
  childId: z.string(),
});
export type JourneyStartRequest = z.infer<typeof JourneyStartRequestSchema>;

export const JourneyStartResponseSchema = z.object({
  journeyId: z.string(),
  currentLevel: z.number(),
  currentPower: FivePowerSchema,
});
export type JourneyStartResponse = z.infer<typeof JourneyStartResponseSchema>;

export const JourneySaveRequestSchema = z.object({
  level: z.number().int().min(1).max(10),
  data: z.record(z.unknown()), // 关卡产出数据（部分保存）
});
export type JourneySaveRequest = z.infer<typeof JourneySaveRequestSchema>;

export const JourneyAdvanceRequestSchema = z.object({
  completedLevel: z.number().int().min(1).max(10),
  output: z.record(z.unknown()),
});
export type JourneyAdvanceRequest = z.infer<typeof JourneyAdvanceRequestSchema>;

export const JourneyStateResponseSchema = z.object({
  journeyId: z.string(),
  childId: z.string(),
  currentPower: FivePowerSchema,
  currentLevel: z.number(),
  completedLevels: z.array(z.number()),
  publishStatus: PublishStatusSchema,
  safetyFlags: z.array(z.unknown()),
  parentConfirm: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type JourneyStateResponse = z.infer<typeof JourneyStateResponseSchema>;

// ── AI Tutor ────────────────────────────────────────────────────────

export const TutorChatRequestSchema = z.object({
  level: z.number().int().min(1).max(10),
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(), // 续接已有对话
});
export type TutorChatRequest = z.infer<typeof TutorChatRequestSchema>;

// ── Safety ──────────────────────────────────────────────────────────

export const SafetyCheckRequestSchema = z.object({
  journeyId: z.string(),
  content: z.record(z.string()).optional(), // 待检查内容
});
export type SafetyCheckRequest = z.infer<typeof SafetyCheckRequestSchema>;

export const SafetyCheckResponseSchema = z.object({
  canPublish: z.boolean(),
  items: z.array(z.object({
    passed: z.boolean(),
    item: z.string(),
    note: z.string().optional(),
  })),
});
export type SafetyCheckResponse = z.infer<typeof SafetyCheckResponseSchema>;

// ── Works ───────────────────────────────────────────────────────────

export const WorkSubmitRequestSchema = z.object({
  journeyId: z.string(),
  title: z.string().min(1).max(50),
  responsibilityStatement: z.string().min(10),
});
export type WorkSubmitRequest = z.infer<typeof WorkSubmitRequestSchema>;

export const WorkAdminListQuerySchema = z.object({
  status: z.enum(["under_review", "approved", "rejected"]).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type WorkAdminListQuery = z.infer<typeof WorkAdminListQuerySchema>;

export const WorkReviewRequestSchema = z.object({
  decision: ReviewDecisionSchema,
  reviewNote: z.string().optional(),
});
export type WorkReviewRequest = z.infer<typeof WorkReviewRequestSchema>;

// ── Cards ───────────────────────────────────────────────────────────

export const CardsQuerySchema = z.object({
  ageStage: AgeStageSchema,
  riskType: z.string().optional(),
});
export type CardsQuery = z.infer<typeof CardsQuerySchema>;

// ── Energy ──────────────────────────────────────────────────────────

export const EnergyDeductRequestSchema = z.object({
  childId: z.string(),
  amount: z.number().int().positive().default(1), // 默认扣1点
  reason: z.enum(["TUTOR_CHAT", "CUSTOM_D_OPTION"]),
});
export type EnergyDeductRequest = z.infer<typeof EnergyDeductRequestSchema>;

export const EnergySupplementRequestSchema = z.object({
  childId: z.string(),
  amount: z.number().int().positive(),
  reason: z.string(), // 运营手动补充原因
  operatorId: z.string(), // 运营人员 ID
});
export type EnergySupplementRequest = z.infer<typeof EnergySupplementRequestSchema>;

export const EnergyStatusResponseSchema = z.object({
  childId: z.string(),
  identity: ChildIdentitySchema,
  currentEnergy: z.number(),
  totalEarned: z.number(),
  totalSpent: z.number(),
});
export type EnergyStatusResponse = z.infer<typeof EnergyStatusResponseSchema>;

// ── Parent ──────────────────────────────────────────────────────────

export const ParentChildrenResponseSchema = z.object({
  children: z.array(z.object({
    childId: z.string(),
    anonymousName: z.string(),
    ageStage: AgeStageSchema,
    currentLevel: z.number(),
    currentPower: FivePowerSchema,
    badgeCount: z.number(),
    identity: ChildIdentitySchema,
    energy: z.number(),
  })),
});
export type ParentChildrenResponse = z.infer<typeof ParentChildrenResponseSchema>;

export const ParentConfirmRequestSchema = z.object({
  approved: z.boolean(),
  note: z.string().optional(),
});
export type ParentConfirmRequest = z.infer<typeof ParentConfirmRequestSchema>;

// ═══════════════════════════════════════════════════════════════════
// 错误码
// ═══════════════════════════════════════════════════════════════════

export const ErrorCode = {
  // 通用
  VALIDATION_ERROR: "VALIDATION_ERROR",         // Zod 校验失败
  UNAUTHORIZED: "UNAUTHORIZED",                 // 未登录
  FORBIDDEN: "FORBIDDEN",                       // 权限不足
  NOT_FOUND: "NOT_FOUND",                       // 资源不存在
  INTERNAL_ERROR: "INTERNAL_ERROR",             // 服务器内部错误

  // 旅程
  JOURNEY_NOT_FOUND: "JOURNEY_NOT_FOUND",       // 旅程不存在
  CANNOT_SKIP_LEVEL: "CANNOT_SKIP_LEVEL",       // 不可跳关
  LEVEL_NOT_COMPLETE: "LEVEL_NOT_COMPLETE",     // 当前关未完成
  SAFETY_CHECK_REQUIRED: "SAFETY_CHECK_REQUIRED", // 需先过第9关
  PUBLISH_STATUS_INVALID: "PUBLISH_STATUS_INVALID", // 发布状态不允许此操作

  // AI Tutor
  AI_RATE_LIMITED: "AI_RATE_LIMITED",           // AI 调用限流
  AI_SAFETY_FLAG: "AI_SAFETY_FLAG",             // 红灯触发
  ENERGY_INSUFFICIENT: "ENERGY_INSUFFICIENT",   // 伍力能量值不足
  IDENTITY_GUEST: "IDENTITY_GUEST",             // 游客身份无法使用答疑

  // 作品
  WORK_ALREADY_SUBMITTED: "WORK_ALREADY_SUBMITTED", // 作品已提交
  WORK_NOT_REVIEWABLE: "WORK_NOT_REVIEWABLE",   // 作品不在可审核状态

  // 能量
  ENERGY_OPERATION_INVALID: "ENERGY_OPERATION_INVALID", // 能量操作无效

  // 家长
  PARENT_NOT_BOUND: "PARENT_NOT_BOUND",         // 家长未绑定此孩子
  PARENT_ALREADY_CONFIRMED: "PARENT_ALREADY_CONFIRMED", // 家长已确认
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
