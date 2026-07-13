# AI5000天 负责任开发者 AI Tutor — API 设计文档

> 版本：v1.0 ｜ 维护者：Claude ｜ 关联代码：`src/types/index.ts`、`src/lib/journey/state-machine.ts`、`prisma/schema.prisma`
>
> 本文档是后端 Route Handler / Server Action 的实现契约。所有 Zod schema 与 `src/types/index.ts` 对齐，状态机规则与 `src/lib/journey/state-machine.ts` 对齐。改 schema 必须同步改本文档。

---

## 目录

1. [总览](#1-总览)
2. [认证 Auth](#2-认证-auth)
3. [旅程核心 Journey Core](#3-旅程核心-journey-core)
4. [关卡保存 Level-Specific Saves（L1–L10）](#4-关卡保存-level-specific-savesl1l10)
5. [AI Tutor 流式对话](#5-ai-tutor-流式对话)
6. [安全审核 Safety](#6-安全审核-safety)
7. [作品发布 Works](#7-作品发布-works)
8. [风险情景卡 Risk Cards](#8-风险情景卡-risk-cards)
9. [伍力能量值 Energy](#9-伍力能量值-energy)
10. [家长端 Parent](#10-家长端-parent)
11. [附录：错误码总表](#11-附录错误码总表)
12. [状态转移速查](#12-状态转移速查)

---

## 1. 总览

### 1.1 架构概要

Next.js 15 App Router 全栈架构，所有端点均为 Route Handler（`src/app/api/**/route.ts`）。状态机推进、AI 调用、安全审核均通过 Server Action / Route Handler 驱动。

```
┌────────────────────────────────────────────────────────────┐
│  前端（孩子端 / 家长端 / 运营后台）                          │
│  ─ NextAuth Session（家长）                                  │
│  ─ Anonymous Token（孩子，JWT）                              │
└──────────────────┬─────────────────────────────────────────┘
                   │ HTTPS + Zod 校验
┌──────────────────▼─────────────────────────────────────────┐
│  Next.js Route Handlers（src/app/api/**）                    │
│  ├─ auth/          认证                                      │
│  ├─ journey/       状态机推进                                │
│  ├─ tutor/         AI 对话（SSE 流式）                       │
│  ├─ safety/        红灯检测 / 发布前审核                     │
│  ├─ works/         作品发布                                  │
│  ├─ cards/         风险情景卡                                │
│  ├─ energy/        能量值                                    │
│  └─ parent/        家长端                                    │
└──────────────────┬─────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   PostgreSQL    Redis      Anthropic
   (Prisma)    (BullMQ)     (lib/ai/client.ts)
```

### 1.2 认证策略

| 身份 | 认证方式 | Token 形态 | 适用端点 |
|------|---------|-----------|---------|
| 孩子（匿名） | `POST /api/auth/anonymous` | JWT（HttpOnly Cookie） | 孩子端全部端点 |
| 家长 | NextAuth v5（手机号+密码） | NextAuth Session Cookie | 家长端、确认发布 |
| 运营 | NextAuth v5（角色 `admin`） | NextAuth Session Cookie | 运营后台全部 `/api/admin/**` |

**孩子端匿名规则**（来自 CLAUDE.md）：
- `anonymousName` 系统生成，格式 `小伍创客[4位随机数字]`，库内唯一
- 不收集真实姓名、学校、班级、地址、精确定位
- 一个匿名 session 对应一个 `Child` 记录，可后续绑定 `parentId`

**Token 校验中间件**：所有非 `auth/*` 端点必须经过 `lib/auth/middleware.ts`，未携带有效凭证返回 `401 UNAUTHORIZED`。

### 1.3 统一响应格式

所有 Server Action / Route Handler 统一返回 `ActionResult<T>`：

```typescript
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
```

HTTP 端点对应的 HTTP 状态码：

| HTTP Status | 含义 | `code` 示例 |
|-------------|------|------------|
| 200 | 成功 | — |
| 400 | 入参校验失败 | `VALIDATION_ERROR` |
| 401 | 未认证 | `UNAUTHORIZED` |
| 403 | 权限不足 / 业务禁止 | `FORBIDDEN`、`CANNOT_SKIP_LEVEL` |
| 404 | 资源不存在 | `NOT_FOUND`、`JOURNEY_NOT_FOUND` |
| 409 | 状态冲突 | `PUBLISH_STATUS_INVALID`、`WORK_ALREADY_SUBMITTED` |
| 422 | 业务校验失败 | `LEVEL_NOT_COMPLETE`、`SAFETY_CHECK_REQUIRED` |
| 429 | 限流 | `AI_RATE_LIMITED` |
| 500 | 服务器错误 | `INTERNAL_ERROR` |

**错误响应体**：

```json
{
  "ok": false,
  "error": "请先完成第1关「小伍风险冒险局」",
  "code": "CANNOT_SKIP_LEVEL"
}
```

### 1.4 通用约定

- **时间戳**：全库统一 `DateTime`（ISO 8601），禁止毫秒时间戳
- **ID 格式**：Prisma `cuid()`，字符串
- **Zod 校验**：所有写入端点入参必须经 Zod 校验，失败返回 `400 VALIDATION_ERROR`，`error` 字段含具体 path
- **AI 调用**：禁止在 Route Handler 内直接 `new Anthropic()`，必须走 `lib/ai/client.ts`
- **分页**：列表端点统一 `page` + `pageSize`，响应含 `total` + `items`

---

## 2. 认证 Auth

### 2.1 POST /api/auth/anonymous — 创建匿名孩子会话

孩子首次进入时调用，生成匿名身份并下发 JWT。

**请求体**（`AnonymousLoginRequestSchema`）：

```typescript
{
  ageStage: "ENLIGHTENMENT" | "GROWTH" | "YOUTH",
  playMode?: "OBSERVER" | "CREATOR" | "DEVELOPER" | "FAMILY"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ageStage` | enum | 是 | 启蒙期 6-8 / 成长期 9-12 / 青春期 13-15 |
| `playMode` | enum | 否 | 默认 `CREATOR` |

**响应体**（`AnonymousLoginResponseSchema`，200）：

```typescript
{
  childId: "clxxxx...",
  anonymousName: "小伍创客3742",
  token: "eyJhbGciOi..."  // JWT，同时通过 Set-Cookie 下发
}
```

**业务规则**：
- `anonymousName` 由 `小伍创客` + 4 位随机数字组成，库内 `@@unique`，冲突时重生成（最多 5 次）
- `identity` 默认 `GUEST`；如请求头带 `X-Organization-Id` 且能在 wqt-auth-backend 验证为有效营地成员，则置为 `MEMBER` 并写入 `organizationId`
- JWT 有效期 30 天，payload 含 `childId`、`ageStage`、`identity`
- Cookie 属性：`HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`

**MVP 当前实现**：
- 已实现最小 `POST /api/auth/anonymous`，创建 `Child` 并返回 `childId`、`anonymousName`
- `token` 暂为 `dev-child:{childId}` 占位；正式上线前替换为 JWT + HttpOnly Cookie

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | `ageStage` 缺失或非法 |
| `INTERNAL_ERROR` | 500 | 匿名名生成连续冲突 5 次 |

---

### 2.2 POST /api/auth/[...nextauth] — NextAuth 标准端点

NextAuth v5 catch-all 路由，覆盖家长/运营登录、注册、登出、session 校验。配置在 `src/lib/auth/config.ts`。

**支持的 action**：

| 路径 | 用途 |
|------|------|
| `POST /api/auth/callback/credentials` | 家长手机号+密码登录 |
| `POST /api/auth/register` | 家长注册（自定义回调） |
| `POST /api/auth/signout` | 登出 |
| `GET  /api/auth/session` | 获取当前 session |
| `GET  /api/auth/csrf` | CSRF token |

**家长登录请求体**：

```typescript
{
  phone: string,        // 11 位手机号
  password: string
}
```

**响应**：NextAuth 标准 session，含 `user.id`、`user.role`（`parent` | `admin`）、`user.phone`。

**业务规则**：
- 家长注册需手机号 + 短信验证码（验证码端点 `POST /api/auth/sms/send`，本文档略）
- 运营账号由超级管理员在后台创建，不开放注册
- session 有效期 7 天，滚动续期

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | 手机号格式错误 / 密码过短 |
| `UNAUTHORIZED` | 401 | 手机号或密码错误 |

---

## 3. 旅程核心 Journey Core

### 3.1 POST /api/journey/start — 创建新旅程

孩子点击「开始闯关」时调用。一个 Child 可有多条 Journey（"再来一局"= 新建）。

**请求体**（`JourneyStartRequestSchema`）：

```typescript
{
  childId: string
}
```

**响应体**（`JourneyStartResponseSchema`，200）：

```typescript
{
  journeyId: "clxxxx...",
  currentLevel: 1,
  currentPower: "SAFETY"
}
```

**业务规则**：
- 调用 `createJourney(childId)`（state-machine.ts），初始化：`currentLevel=1`、`currentPower=SAFETY`、`completedLevels=[]`、`publishStatus=DRAFT`、`safetyFlags=[]`、`parentConfirm=false`
- 同一 child 允许有未完成旅程时新建（用于"再来一局"），但 UI 应提示
- 写一条 `JourneyLog`：`trigger="journey_created"`

**MVP 当前实现**：
- 已实现最小 `POST /api/journey/start`
- 当前只创建 `Journey`，状态机推进日志从第1关完成后开始记录

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | `childId` 缺失 |
| `UNAUTHORIZED` | 401 | JWT 中的 `childId` 与请求体不匹配 |
| `NOT_FOUND` | 404 | `childId` 不存在 |

---

### 3.2 GET /api/journey/[id] — 获取旅程状态

获取旅程完整状态，含最近 20 条对话、作品、徽章。

**MVP 当前实现**：
- 已实现 `GET /api/journey/[journeyId]`
- 返回 Journey、匿名 child 基本信息、最近 20 条 conversations
- 当前尚未接入权限中间件，正式上线前必须校验 child/parent/admin 权限

**路径参数**：`id` = journeyId

**查询参数**：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `includeConversations` | boolean | true | 是否含最近对话 |
| `includeWork` | boolean | true | 是否含作品 |

**响应体**（`JourneyStateResponseSchema` + 关联，200）：

```typescript
{
  journeyId: string,
  childId: string,
  currentPower: "SAFETY" | "BRAINWAVE" | "SENSING" | "CREATIVITY" | "COMMUNICATION",
  currentLevel: number,           // 1-10
  completedLevels: number[],      // 如 [1,2,3]
  publishStatus: "DRAFT" | "REVIEWING" | "APPROVED" | "REJECTED",
  safetyFlags: SafetyFlag[],      // 红灯记录
  parentConfirm: boolean,
  // 各关产出字段（按 currentLevel 阶段性返回，未到的关为 null）
  powerScores?: PowerScores,
  cardsPlayed?: CardPlayRecord[],
  top3Concerns?: string[],
  selectedIssue?: string,
  // ... 其余字段见 schema.prisma Journey model
  createdAt: string,              // ISO 8601
  updatedAt: string,
  // 关联
  child: { id, anonymousName, ageStage, parentId },
  conversations?: Conversation[], // 最近 20 条
  work?: Work,
  badge?: Badge
}
```

**业务规则**：
- 调用 `getJourneyState(journeyId)`（state-machine.ts）
- 权限校验：JWT 中的 `childId` 必须等于 `journey.childId`，或当前 session 是该 child 的家长，否则 403
- `safetyFlags` 中的 `context` 字段已截断为前 200 字（隐私保护）

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `UNAUTHORIZED` | 401 | 未登录 |
| `FORBIDDEN` | 403 | 无权访问该旅程 |
| `JOURNEY_NOT_FOUND` | 404 | journeyId 不存在 |

---

### 3.3 POST /api/journey/[id]/advance — 推进到下一关

完成当前关并推进。这是状态机的核心入口。

**路径参数**：`id` = journeyId

**请求体**（`JourneyAdvanceRequestSchema`）：

```typescript
{
  completedLevel: number,           // 1-10，本次完成的关卡
  output: Record<string, unknown>   // 该关产出，需通过 Level{N}OutputSchema 校验
}
```

**响应体**（200）：

```typescript
{
  journeyId: string,
  previousLevel: number,
  currentLevel: number,             // 推进后的关卡
  previousPower: FivePower,
  currentPower: FivePower,
  completedLevels: number[],
  publishStatus: PublishStatus,
  badgeAwarded?: { type: string; power?: string }  // 若触发徽章
}
```

**业务规则**（来自 `advanceLevel()`）：

1. **当前关卡校验**：`journey.currentLevel` 必须等于 `completedLevel`。若 `completedLevel` 已在 `completedLevels` 中，转为调用 `saveLevelOutput`（只保存不推进），返回 200 但 `currentLevel` 不变
2. **前置条件**（`canAdvanceToLevel`）：
   - 必须按顺序解锁，`completedLevel - 1` 必须已在 `completedLevels`
   - 第 3 关起，第 1-2 关必须都已完成
   - 第 10 关要求第 9 关完成且 `publishStatus ∈ {REVIEWING, APPROVED}`
3. **产出校验**：`output` 必须通过 `Level{completedLevel}OutputSchema` 的 `validationSchema`，否则 422 `LEVEL_NOT_COMPLETE`
4. **publishStatus 转移**：完成第 9 关时，`DRAFT → REVIEWING`（含安全审核通过）
5. **事务**：更新 Journey + 写 JourneyLog（`trigger="level_complete"`）
6. **徽章**：完成第 10 关且 `allChecksPassed` 时，写入 `Badge`（type=`负责任开发者`）

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | `completedLevel` 越界 / `output` 不符合 schema |
| `UNAUTHORIZED` | 401 | 未登录 |
| `FORBIDDEN` | 403 | 该 child 无权操作此 journey |
| `JOURNEY_NOT_FOUND` | 404 | journeyId 不存在 |
| `CANNOT_SKIP_LEVEL` | 403 | 前置关卡未完成 / 试图跳关 |
| `LEVEL_NOT_COMPLETE` | 422 | 产出未满足完成条件（如 cardsPlayed < 6） |
| `SAFETY_CHECK_REQUIRED` | 422 | 第 9 关未通过安全审核 |
| `PUBLISH_STATUS_INVALID` | 409 | publishStatus 状态不允许此操作 |

---

### 3.4 POST /api/journey/[id]/save — 保存当前关卡（不推进）

断点续填场景，部分保存字段，不做完成校验、不推进状态。

**路径参数**：`id` = journeyId

**请求体**（`JourneySaveRequestSchema`）：

```typescript
{
  level: number,                    // 1-10
  data: Record<string, unknown>     // 部分产出，字段对应 Journey model
}
```

**响应体**（200）：

```typescript
{
  journeyId: string,
  savedLevel: number,
  savedFields: string[],            // 实际写入的字段名
  updatedAt: string
}
```

**业务规则**：
- 调用 `saveLevelOutput(journeyId, level, data)`（state-machine.ts）
- `level` 必须等于 `journey.currentLevel` 或在 `completedLevels` 中（允许回看修改已完成关卡）
- `data` 中的字段名必须在该关 `LevelConfig.outputFields` 列表内，否则忽略并记入 `savedFields` 排除项
- 不做 `validationSchema` 校验（允许部分填写）
- 不写 JourneyLog（仅 advance 才写）

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | `level` 越界 |
| `FORBIDDEN` | 403 | `level` 既不是当前关也不是已完成关 |
| `JOURNEY_NOT_FOUND` | 404 | journeyId 不存在 |

---

## 4. 关卡保存 Level-Specific Saves（L1–L10）

`POST /api/journey/[id]/level/N` 是带类型的保存端点，对 `Level{N}OutputSchema` 做字段级类型校验（允许部分填写，不强制 `.min()/.length()` 完成条件），用于断点续填。

**通用规则（适用于 L1–L10）**：

- **路径**：`POST /api/journey/[journeyId]/level/{N}`，N ∈ [1,10]
- **请求体**：`Level{N}OutputSchema` 的 deep partial（所有字段可选，但类型必须匹配）
- **响应体**（200）：

```typescript
{
  journeyId: string,
  level: N,
  savedFields: string[],
  completionStatus: {
    valid: boolean,                // 是否满足该关 validationSchema
    missingFields: string[]        // 未满足的字段路径
  },
  updatedAt: string
}
```

- **业务规则**：
  - `N` 必须等于 `journey.currentLevel` 或在 `completedLevels` 中，否则 403
  - 字段写入对应 Journey 字段（见各关 outputFields）
  - 不推进状态。完成时客户端应调用 `POST /api/journey/[id]/advance`
  - `completionStatus` 由 `validateLevelOutput(N, mergedOutput)` 计算，前端据此决定"提交闯关"按钮是否可点
- **通用错误码**：`VALIDATION_ERROR`(400) / `UNAUTHORIZED`(401) / `FORBIDDEN`(403) / `JOURNEY_NOT_FOUND`(404)

各关具体字段如下。

---

### 4.1 POST /api/journey/[id]/level/1 — 第1关 · 小伍风险冒险局

**所属五力**：安全力觉醒 ｜ **模板**：A ｜ **解锁**：旅程开始即可进入

**请求体**（`Level1OutputSchema` partial）：

```typescript
{
  entryChoice?: "RECOMMEND" | "IDEA",        // 入口选择
  ideaText?: string,                          // 自带点子（entryChoice=IDEA 时必填）
  powerScores?: {                             // 五力了解度自评（1-5 滑条）
    bodySafety: number,        // 身体安全
    mentalSafety: number,      // 心理安全
    socialSafety: number,      // 社交安全
    economicSafety: number,    // 经济安全
    digitalRights: number      // 数字权益
  },
  cardsPlayed?: Array<{                       // 卡牌答题记录
    cardId: string,
    selectedOption: "A" | "B" | "C" | "D",
    customOption?: string,                    // D 选项自创内容
    powerChanges: Record<string, number>      // 如 { "安全力": 1, "实感力": -1 }
  }>,
  top3Concerns?: string[],                    // 关心问题 Top 3（长度 3 时满足完成条件）
  wqtSessionId?: string,                      // WQT game_sessions.id
  wqtReviewSnapshot?: {                       // WQT 复盘快照
    session: Record<string, unknown>,
    cards: Array<Record<string, unknown>>,
    skills?: Array<Record<string, unknown>>,
    durationMs?: number | null
  },
  wqtReviewReportUrl?: string                 // WQT 生成的复盘网页
}
```

**完成条件**（`validationSchema`）：
- `wqtSessionId` 存在（引用 WQT 自己的 `game_sessions.id`）
- `wqtReviewSnapshot` 存在（保留 WQT 原始复盘事实）
- `cardsPlayed.length >= 6`（至少 6 张答题卡）
- `top3Concerns.length === 3`（必须选定 3 个关心问题）

**WQT 嵌入约定**：
- WQT 继续作为第1关卡牌事实源，负责卡牌数据、选择记录、计分反馈、计分界面和复盘网页
- AI Tutor 保存 `wqtSessionId`、`wqtReviewSnapshot`、`wqtReviewReportUrl`
- `cardsPlayed`、`top3Concerns` 是从 WQT 快照派生出的状态机兼容字段，不作为 WQT 的事实源
- MVP 回调端点：`POST /api/wqt/level1/complete`，请求体含 `journeyId`、`wqtSessionId`、`reviewSnapshot`、可选 `reportUrl`
- 如配置 `WQT_CALLBACK_SECRET`，WQT 回调必须带 `X-WQT-Callback-Secret` 请求头

**业务规则**：
- 第1关页面 `/journey/[journeyId]/level/1` 通过 iframe 嵌入 WQT
- WQT 若在浏览器侧完成，可发送 `postMessage({ type: "WQT_LEVEL1_COMPLETED", sessionId, reviewSnapshot, reportUrl })`
- 服务端收到完成回调后调用状态机推进到第2关
- 写入 Journey 字段：`entryChoice`、`ideaText`、`cardsPlayed`、`top3Concerns`、`wqtSessionId`、`wqtReviewSnapshot`、`wqtReviewReportUrl`

---

### 4.2 POST /api/journey/[id]/level/2 — 第2关 · 责任议题锁定

**所属五力**：安全力觉醒 ｜ **模板**：A ｜ **解锁**：完成第1关

**MVP 当前实现**：
- 页面：`/journey/[journeyId]/level/2`
- 端点：`POST /api/journey/[journeyId]/level/2`
- 当前先从第1关 `top3Concerns` 派生三议题五维评估，孩子选择 `selectedIssueIndex` 后推进状态机
- 页面内提供最小 AI Tutor 提问框，调用 `POST /api/tutor/[journeyId]`

**请求体**（`Level2OutputSchema` partial）：

```typescript
{
  threeIssueEvals?: Array<{                   // 三议题五维自评（长度 3 时满足）
    issue: string,
    fiveDim: {
      resonance: number,        // 共振 1-5
      responsibility: number,   // 责任 1-5
      originality: number,      // 原创 1-5
      embeddedness: number,     // 嵌入 1-5
      feasibility: number       // 可行 1-5
    },
    followUps: Array<{          // 低分追问记录（任意低分维度触发）
      dimension: string,
      score: number,
      question: string,         // 小伍的追问
      answer: string            // 孩子的回答
    }>
  }>,
  systemRecommendation?: string,              // 系统推荐（共振 x 可行 最优）
  selectedIssue?: string,                     // 最终选择
  selectedIssueIndex?: number                 // 0-2
}
```

**完成条件**：
- `threeIssueEvals.length === 3`（三议题都完成五维自评）
- `selectedIssue` 非空

**业务规则**：
- `threeIssueEvals` 中的 `issue` 必须来自第1关 `top3Concerns`（注入依赖 `injectsFrom: [1]`）
- `systemRecommendation` 由后端基于 `resonance * feasibility` 最高分计算并回填，前端提交时若与后端计算不一致，以服务端为准
- 任一维度 `score <= 3` 时应触发 `followUps`（前端控制，后端不强校验）

---

### 4.3 POST /api/journey/[id]/level/3 — 第3关 · 实感力启动

**所属五力**：实感力锻造 ｜ **模板**：A ｜ **解锁**：完成第2关

**MVP 当前实现**：
- 页面：`/journey/[journeyId]/level/3`
- 端点：`POST /api/journey/[journeyId]/level/3`
- 当前最小表单收集 `protagonist`、`plot`、`evidence`、`materialMethod`、`materialContent`
- 服务端将素材规范为 `materialSources[0]`，并补三轮固定追问，提交后推进状态机到第4关
- 页面内提供最小 AI Tutor 提问框，调用 `POST /api/tutor/[journeyId]`

**请求体**（`Level3OutputSchema` partial）：

```typescript
{
  protagonist?: string,                       // 主角
  plot?: string,                              // 情节
  evidence?: string,                          // 证据
  materialSources?: Array<{                   // 素材来源（至少 1 种）
    method: "MEMORY" | "PEER" | "COMMUNITY" | "INTERNET",
    content: string,
    followUps: Array<{
      round: number,           // 1=细节, 2=证据, 3=深度
      question: string,
      answer: string
    }>
  }>
}
```

**完成条件**：
- `protagonist` 非空
- `plot.length >= 10`
- `evidence` 非空
- `materialSources.length >= 1`

**业务规则**：
- 议题注入自第2关 `selectedIssue`（`injectsFrom: [2]`）
- `method` 四选一：MEMORY（回忆）/ PEER（同伴访谈）/ COMMUNITY（社区调研）/ INTERNET（网络检索）
- `followUps` 是"写死追问"——每条素材固定 3 轮，由小伍 AI 生成问题，孩子回答

---

### 4.4 POST /api/journey/[id]/level/4 — 第4关 · 问题侦探局

**所属五力**：实感力锻造 ｜ **模板**：A ｜ **解锁**：完成第3关

**MVP 当前实现**：
- 页面：`/journey/[journeyId]/level/4`
- 端点：`POST /api/journey/[journeyId]/level/4`
- 当前最小表单收集 `surfaceDescription`、`stakeholdersText`、`rootCausesText`、`previousWho`、`previousWhat`、`previousWhyFailed`、`entryWindow`
- 服务端将多行/逗号文本规范为 `stakeholders` 和 `rootCauses` 数组，提交后推进状态机到第5关
- 页面内提供最小 AI Tutor 提问框，调用 `POST /api/tutor/[journeyId]`

**请求体**（`Level4OutputSchema` partial）：

```typescript
{
  surfaceDescription?: string,                // 表象（大家看到的）
  stakeholders?: string[],                    // 牵涉了谁（水面下）
  rootCauses?: string[],                      // 根源（为何没解决）
  previousAttempts?: Array<{                  // 谁试过
    who: string,
    what: string,
    whyFailed: string
  }>,
  entryWindow?: string                        // 切入窗口
}
```

**完成条件**：
- `surfaceDescription` 非空
- `stakeholders.length >= 1`
- `rootCauses.length >= 1`
- `entryWindow` 非空

**业务规则**：
- 注入第3关实感故事卡（`injectsFrom: [3]`），用于在 UI 中对照
- `previousAttempts` 可为空数组（不强制），但前端鼓励填写以生成更完整的冰山图
- 输出在 UI 上渲染为"冰山图"：水面=表象，水下=stakeholders+rootCauses

---

### 4.5 POST /api/journey/[id]/level/5 — 第5关 · AI机制拆解局

**所属五力**：脑波力启蒙 ｜ **模板**：A ｜ **解锁**：完成第4关

**MVP 当前实现**：
- 页面：`/journey/[journeyId]/level/5`
- 端点：`POST /api/journey/[journeyId]/level/5`
- 当前最小表单收集 `mechanismDescription`、`aiCanDoText`、`aiCannotDoText`、可选 `analogyDescription`
- 服务端将多行/逗号文本规范为 `aiCanDo` 和 `aiCannotDo` 数组，提交后推进状态机到第6关
- 页面内提供最小 AI Tutor 提问框，调用 `POST /api/tutor/[journeyId]`

**请求体**（`Level5OutputSchema` partial）：

```typescript
{
  mechanismDescription?: string,              // 议题机制描述（>= 10 字）
  aiCanDo?: string[],                         // AI 能做的
  aiCannotDo?: string[],                      // AI 不能做的
  analogyDescription?: string                 // 少年版比喻描述（可选）
}
```

**完成条件**：
- `mechanismDescription.length >= 10`
- `aiCanDo.length >= 1`
- `aiCannotDo.length >= 1`

**少年版差异**：Step1 只看 3-4 种常见 AI；Step3 作业改为打比方描述机制（`analogyDescription`）。

**业务规则**：
- 注入第2关议题 + 第4关切入窗口（`injectsFrom: [2, 4]`）
- `aiCanDo` / `aiCannotDo` 为字符串数组，每项是一条具体能力描述

---

### 4.6 POST /api/journey/[id]/level/6 — 第6关 · AI共创准备站

**所属五力**：脑波力启蒙 ｜ **模板**：A ｜ **解锁**：完成第5关

**MVP 当前实现**：
- 页面：`/journey/[journeyId]/level/6`
- 端点：`POST /api/journey/[journeyId]/level/6`
- 当前最小表单收集五模块：`promptTemplate`、`testPlan`、`modularPlan`、`securityRule`、`ethicsReminder`
- 同时收集三类清单：`collaborationText`、`safetyText`、`ethicsText`
- 服务端生成 `modules`、`simplifiedModules`、`collaborationChecklist`、`safetyItems`、`ethicsItems`，提交后推进状态机到第7关
- 页面内提供最小 AI Tutor 提问框，调用 `POST /api/tutor/[journeyId]`

**请求体**（`Level6OutputSchema` partial）：

```typescript
{
  modules?: Array<{                           // 五模块作业（青年版）
    moduleId: "PROMPT" | "TEST" | "MODULAR" | "SECURITY" | "ETHICS",
    content: string
  }>,
  simplifiedModules?: Array<{                 // 三模块作业（少年版）
    moduleId: "PROMPT_TEMPLATE" | "SAFETY_RULE" | "ETHICS_REMINDER",
    content: string
  }>,
  collaborationChecklist?: string[],          // 协作流程
  safetyItems?: string[],                     // 安全项
  ethicsItems?: string[]                      // 伦理项
}
```

**完成条件**：
- `collaborationChecklist.length >= 1`
- `safetyItems.length >= 1`
- `ethicsItems.length >= 1`
- 青年版另校验 `modules.length >= 5`（五模块全完成）；少年版校验 `simplifiedModules.length >= 3`

**少年版差异**：模块精简为 3 块——Prompt 模板 + 安全铁律 + 伦理提醒。

**业务规则**：
- 是否走少年版由 `isLevelSimplified(6, child.ageStage)` 判定（启蒙期/成长期走 simplified）
- 注入第5关机制拆解 + 能/不能清单（`injectsFrom: [5]`）
- `modules` 与 `simplifiedModules` 互斥，按 ageStage 选其一

---

### 4.7 POST /api/journey/[id]/level/7 — 第7关 · 愿景与方法站

**所属五力**：创心力迸发 ｜ **模板**：A ｜ **解锁**：完成第6关

**MVP 当前实现**：
- 页面：`/journey/[journeyId]/level/7`
- 端点：`POST /api/journey/[journeyId]/level/7`
- 当前最小表单收集 `vision`、`aiAction`、ABC 三格（`awareness`、`behavior`、`result`）、`demoPlan`、`effectVerification`、可选 `responsibilityDecision`
- 服务端生成 `abcCanvas`，提交后推进状态机到第8关
- 页面内提供最小 AI Tutor 提问框，调用 `POST /api/tutor/[journeyId]`

**请求体**（`Level7OutputSchema` partial）：

```typescript
{
  vision?: string,                            // 愿景一句话
  aiAction?: string,                          // AI Action
  abcCanvas?: {                               // ABC 技术画布
    A_awareness: string,     // A 意识唤醒
    B_behavior: string,      // B 行为干预
    C_result: string         // C 结果验证
  },
  demoPlan?: string,                          // Demo 规划
  effectVerification?: string,                // 效果验证标准
  responsibilityDecision?: string             // 中途责任决策点记录（可选）
}
```

**完成条件**：
- `vision` 非空
- `abcCanvas.A_awareness`、`B_behavior`、`C_result` 都非空
- `demoPlan` 非空

**业务规则**：
- 注入：议题 + 切入窗口 + 机制 + 第6关清单（`injectsFrom: [2, 4, 5, 6]`）
- `responsibilityDecision` 记录中途出现的责任决策点（如"是否收集未成年人数据"），用于第9关安全审核回溯

---

### 4.8 POST /api/journey/[id]/level/8 — 第8关 · Demo工坊

**所属五力**：创心力迸发 ｜ **模板**：B ｜ **解锁**：完成第7关

**请求体**（`Level8OutputSchema` partial）：

```typescript
{
  demoUrl?: string,                           // Demo URL（EdgeOne 部署后，必须合法 URL）
  iterations?: Array<{                        // 迭代记录（至少 1 次）
    version: number,
    changes: string,
    testResult: string,
    responsibilityNote?: string               // 责任审查记录
  }>,
  responsibilityReview?: string,              // 责任审查总记录
  engineeringCheckpoint?: boolean,            // 工程审查完成（必须 true）
  bodyRelaxCheckpoint?: boolean,              // 身体放松完成（必须 true）
  edgeOneAssetId?: string                     // EdgeOne 资产 ID
}
```

**完成条件**：
- `demoUrl` 是合法 URL
- `iterations.length >= 1`
- `engineeringCheckpoint === true`
- `bodyRelaxCheckpoint === true`

**业务规则**：
- 注入第6关清单 + 第7关方案蓝图（`injectsFrom: [6, 7]`）
- Demo 通过 EdgeOne MCP 一键部署，`edgeOneAssetId` 由部署流程回填
- 两个 checkpoint 是**强制**：`engineeringCheckpoint`（工程审查，由系统检测 Demo 可访问性、基础功能）+ `bodyRelaxCheckpoint`（身体放松，孩子确认做了眼保健操/拉伸，由前端打卡）
- `iterations` 至少 1 次，鼓励多次迭代

---

### 4.9 POST /api/journey/[id]/level/9 — 第9关 · 影响力（安全审核强制节点）

**所属五力**：沟通力绽放 ｜ **模板**：C ｜ **解锁**：完成第8关 ｜ **特殊**：发布前强制安全检查

**请求体**（`Level9OutputSchema` partial）：

```typescript
{
  realImpact?: string,                        // 真实影响力（>= 5 字）
  spreadImpact?: string,                      // 传播影响力
  slogan?: string,                            // slogan
  sustainedImpact?: string,                   // 持续影响力（商业闭环，少年版可省）
  stakeholderAnalysis?: string                // 利益相关方分析（可选）
}
```

**完成条件**：
- `realImpact.length >= 5`
- `spreadImpact` 非空
- `slogan` 非空

**少年版差异**：只留真实影响力 + 一句 slogan，去掉商业闭环（`sustainedImpact` 可省）。

**业务规则**：
- 注入第8关 Demo（`injectsFrom: [8]`）
- **安全审核强制**：本关完成时（advance），后端自动调用 `POST /api/safety/check`（见 §6），生成 `safetyReport` 写入 Journey
- 安全审核未通过时，advance 返回 422 `SAFETY_CHECK_REQUIRED`，不推进
- 安全审核通过 + 本关产出校验通过 -> `publishStatus: DRAFT -> REVIEWING`
- `safetyReport` 结构由 §6 定义

---

### 4.10 POST /api/journey/[id]/level/10 — 第10关 · 小伍创客发布会

**所属五力**：沟通力绽放 ｜ **模板**：D ｜ **解锁**：完成第9关且通过安全审核

**请求体**（`Level10OutputSchema` partial）：

```typescript
{
  publishScript?: {                           // 发布会脚本
    problem: string,         // 我看到__
    solution: string,        // 所以我做了__
    audience: string         // 它能帮__
  },
  videoUrl?: string,                          // 录制视频 URL
  workCardGenerated?: boolean,                // 作品卡已生成
  allChecksPassed?: boolean,                  // 发布闸口全部通过
  parentConfirmed?: boolean                   // 家长确认（来自 ParentConfirmation）
}
```

**完成条件**：
- `publishScript.problem/solution/audience` 都非空
- `videoUrl` 非空
- `allChecksPassed === true`
- `parentConfirmed === true`

**业务规则**：
- 注入第8关 Demo + 第9关影响力方案（`injectsFrom: [8, 9]`）
- `parentConfirmed` 不能由孩子端直接写入，必须通过 `POST /api/parent/confirm/[workId]`（见 §10.2）由家长确认后回填
- `allChecksPassed` 由后端在 advance 时综合校验：Demo 可访问 + 视频存在 + 家长已确认 + 安全审核通过
- 完成本关 -> 写入 `Badge(type="负责任开发者")`、生成 `Work` 记录、`publishStatus: REVIEWING -> APPROVED`（在运营审核 + 家长确认都满足后）

**错误码**（额外）：

| code | HTTP | 触发条件 |
|------|------|---------|
| `SAFETY_CHECK_REQUIRED` | 422 | 第9关安全审核未通过 |
| `PARENT_NOT_BOUND` | 422 | 孩子未绑定家长，无法确认 |
| `PUBLISH_STATUS_INVALID` | 409 | 第9关未完成 / publishStatus 非 REVIEWING |

---

## 5. AI Tutor 流式对话

### 5.1 POST /api/tutor/[journeyId] — 小伍 AI 对话（SSE 流式）

孩子在小伍答疑窗提问时调用，返回 SSE 流，含对话文本 + 结构化输出。

**MVP 当前实现**：
- 已实现 `POST /api/tutor/[journeyId]` 的 JSON 版本，先打通 `Journey -> Conversation -> lib/ai/client.ts`
- 所有模型调用集中在 `src/lib/ai/client.ts`；Route Handler 不直接 new SDK
- 未配置 `ANTHROPIC_API_KEY` 时返回本地 fallback 引导语，方便开发环境验证
- 后续再把同一路径升级为 SSE 流式响应

**路径参数**：`journeyId`

**请求体**（`TutorChatRequestSchema`）：

```typescript
{
  level: number,                    // 1-10，当前关卡（决定 stage prompt）
  message: string,                  // 1-2000 字
  conversationId?: string           // 续接已有对话
}
```

**响应**：`Content-Type: text/event-stream`，SSE 事件流。

**事件类型**：

| event | data 结构 | 说明 |
|-------|----------|------|
| `start` | `{ conversationId: string }` | 流开始，返回对话 ID |
| `delta` | `{ text: string }` | 文本增量（孩子看到的对话） |
| `structured` | `{ structuredOutput: object }` | AI 提取的本轮结构化字段（流末尾） |
| `safety_flag` | `{ type: SafetyFlagType, message: string }` | 红灯触发，立即中断普通流程 |
| `done` | `{ conversationId, tokenCount, finishReason }` | 流结束 |
| `error` | `{ code, error }` | 错误，流终止 |

**SSE 示例**：

```
event: start
data: {"conversationId":"clxxxx"}

event: delta
data: {"text":"嗯，"}

event: delta
data: {"text":"你想做的是"}

event: structured
data: {"structuredOutput":{"protagonist":"小学生","plot":"..."}}

event: done
data: {"conversationId":"clxxxx","tokenCount":342,"finishReason":"end_turn"}
```

**业务规则**（来自 CLAUDE.md AI Tutor 约定）：

1. **Prompt 构造顺序**：
   - `system.ts`（小伍身份、儿童友好、安全红线）
   - `stages/level-{N}.ts`（本关目标、提问顺序、输出字段定义）
   - `guardrails.ts`（隐私/危险行为检查规则）
   - 拼接对话历史（从 `Conversation` 表取最近 20 条）
2. **红灯机制**（`lib/ai/safety.ts`）：
   - 在用户输入和 AI 输出**双向**检查
   - 触发红灯时：立即停止普通流程 -> 写入 `journey.safetyFlags` -> 返回 `safety_flag` 事件 -> 返回安全提示文案（不走正常 stage prompt）
   - 自伤/威胁类：直接跳出对话，前端显示求助资源
   - 红灯类型：`self_harm`、`threat`、`pii`（真实姓名/地址/电话）、`credentials`、`api_key`、`unauthorized_media`
3. **结构化输出**：AI 必须以 JSON block 结尾，前端从流中解析最后的 JSON，写入 `Conversation.structuredOutput`，并合并到 Journey 对应字段
4. **能量扣减**：每次对话扣 1 点能量（见 §9），游客身份（`GUEST`）禁用答疑
5. **AI 调用**：必须通过 `lib/ai/client.ts`，禁止直接 `new Anthropic()`
6. **限流**：单 child 30 秒内最多 5 次对话，超限返回 429

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | `message` 为空或超 2000 字 / `level` 越界 |
| `UNAUTHORIZED` | 401 | 未登录 |
| `FORBIDDEN` | 403 | 该 child 无权操作此 journey |
| `JOURNEY_NOT_FOUND` | 404 | journeyId 不存在 |
| `AI_RATE_LIMITED` | 429 | 调用过频 |
| `AI_SAFETY_FLAG` | 200(sse) | 红灯触发（通过 `safety_flag` 事件传达，非 HTTP 错误） |
| `ENERGY_INSUFFICIENT` | 402 | 能量值不足（HTTP 402 Payment Required，语义为"需要能量"） |
| `IDENTITY_GUEST` | 403 | 游客身份无法使用答疑 |
| `INTERNAL_ERROR` | 500 | AI 调用失败（重试 3 次后仍失败） |

---

## 6. 安全审核 Safety

### 6.1 POST /api/safety/check — 发布前安全检查

第9关强制调用，也可用于任意关卡的实时红灯检测。

**请求体**（`SafetyCheckRequestSchema`）：

```typescript
{
  journeyId: string,
  content?: Record<string, string>   // 待检查内容键值对，如 { demoUrl, slogan, realImpact }
                                     // 省略时检查整个 Journey 的所有文本字段
}
```

**响应体**（`SafetyCheckResponseSchema`，200）：

```typescript
{
  canPublish: boolean,
  items: Array<{
    passed: boolean,
    item: string,                    // 检查项名，如 "demo_url_accessible"
    note?: string                    // 失败原因或补充说明
  }>,
  report?: {                         // canPublish=false 或第9关时附完整报告
    checkedAt: string,               // ISO 8601
    checkedFields: string[],
    flaggedContent: Array<{ field, type, snippet }>,
    recommendation: string           // 给运营/家长的处置建议
  }
}
```

**检查项**（`items[]`）：

| item | 说明 |
|------|------|
| `pii_in_content` | 文本中是否含真实姓名/地址/电话 |
| `credentials_leak` | 是否含账号密码/API Key |
| `self_harm_signal` | 是否含自伤/自杀信号 |
| `threat_signal` | 是否含被威胁信号 |
| `unauthorized_media` | Demo 中是否使用未授权素材 |
| `demo_url_accessible` | Demo URL 是否可访问（HTTP 200） |
| `demo_basic_function` | Demo 基础功能是否可用（自动化检测） |
| `slogan_appropriate` | slogan 是否适合公开传播 |

**业务规则**：
- 第9关 advance 时**自动调用**，结果写入 `journey.safetyReport`（JSON）
- `canPublish === false` 时，第9关 advance 返回 422 `SAFETY_CHECK_REQUIRED`
- 检查在 BullMQ 异步队列中执行（Redis），同步返回的 `canPublish` 仅作即时反馈，最终以 `journey.safetyReport` 为准
- `flaggedContent.snippet` 仅保留前 200 字（隐私）
- 自伤/威胁类立即触发家长通知（如有绑定家长）

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | journeyId 缺失 |
| `JOURNEY_NOT_FOUND` | 404 | journeyId 不存在 |
| `INTERNAL_ERROR` | 500 | 检查队列不可用 |

---

## 7. 作品发布 Works

### 7.1 POST /api/works/submit — 提交作品审核

第9关通过、`publishStatus === REVIEWING` 后，孩子端提交作品进入运营审核。

**请求体**（`WorkSubmitRequestSchema`）：

```typescript
{
  journeyId: string,
  title: string,                          // 1-50 字
  responsibilityStatement: string         // 责任声明，>= 10 字
}
```

**响应体**（200）：

```typescript
{
  workId: string,
  journeyId: string,
  title: string,
  creatorNickname: string,                // 孩子匿名名
  publishStatus: "under_review",          // Work 表状态
  submittedAt: string                     // ISO 8601
}
```

**业务规则**：
- 前置：`journey.completedLevels` 必须含 9，`publishStatus === REVIEWING`
- 自动从 Journey 派生：`creatorNickname`（=child.anonymousName）、`ageStage`、`riskTypes`（从 cardsPlayed 推断）、`usedPowers`（从 completedLevels 推断）、`demoUrl`、`videoUrl`、`slogan`
- `Work` 表 `publishStatus` 初始 `under_review`，与 `Journey.publishStatus`（REVIEWING）独立
- 同一 journey 只能提交一次，重复提交返回 409 `WORK_ALREADY_SUBMITTED`
- 写 `JourneyLog`：`trigger="work_submitted"`

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | title/responsibilityStatement 长度不合规 |
| `SAFETY_CHECK_REQUIRED` | 422 | 第9关未通过安全审核 |
| `PUBLISH_STATUS_INVALID` | 409 | publishStatus 不是 REVIEWING |
| `WORK_ALREADY_SUBMITTED` | 409 | 该 journey 已有 Work 记录 |

---

### 7.2 GET /api/admin/works — 运营审核列表

运营后台获取待审核/已审核作品列表。需运营 session。

**查询参数**（`WorkAdminListQuerySchema`）：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `status` | enum | -- | `under_review` / `approved` / `rejected`，省略=全部 |
| `page` | number | 1 | 页码 |
| `pageSize` | number | 20 | 每页条数（max 100） |

**响应体**（200）：

```typescript
{
  items: Array<{
    workId: string,
    title: string,
    creatorNickname: string,
    ageStage: string,
    riskTypes: string[],
    demoUrl: string,
    videoUrl: string,
    slogan: string,
    responsibilityStatement: string,
    publishStatus: "under_review" | "approved" | "rejected",
    submittedAt: string,
    reviewedAt?: string,
    reviewNote?: string
  }>,
  total: number,
  page: number,
  pageSize: number
}
```

**业务规则**：
- 仅运营角色（`session.user.role === "admin"`）可访问
- 默认按 `submittedAt DESC` 排序
- `responsibilityStatement` 含敏感信息时由前端做截断显示

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `UNAUTHORIZED` | 401 | 未登录 |
| `FORBIDDEN` | 403 | 非 admin 角色 |

---

### 7.3 PUT /api/admin/works/[id] — 审核通过/驳回

运营对单个作品做出审核决定。

**路径参数**：`id` = workId

**请求体**（`WorkReviewRequestSchema`）：

```typescript
{
  decision: "APPROVE" | "REJECT",
  reviewNote?: string          // 驳回时必填，通过时可选
}
```

**响应体**（200）：

```typescript
{
  workId: string,
  publishStatus: "approved" | "rejected",
  reviewedBy: string,          // 运营 ID
  reviewedAt: string,
  journeyPublishStatus: "APPROVED" | "REJECTED"   // 同步后的 Journey.publishStatus
}
```

**业务规则**：
- 仅 `publishStatus === "under_review"` 的作品可审核，否则 409 `WORK_NOT_REVIEWABLE`
- `decision === "REJECT"` 时 `reviewNote` 必填（>= 10 字）
- 同步更新 `Journey.publishStatus`：
  - APPROVE：若 `parentConfirm === true` -> `REVIEWING -> APPROVED`；否则保持 REVIEWING（等待家长确认）
  - REJECT：`REVIEWING -> REJECTED`
- APPROVE 时若 `parentConfirm` 已为 true，自动触发：生成最终作品卡、点亮徽章、写 JourneyLog `trigger="work_published"`
- 事务：更新 Work + 更新 Journey + 写 JourneyLog

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | decision 非法 / REJECT 时 reviewNote 缺失或过短 |
| `FORBIDDEN` | 403 | 非 admin |
| `NOT_FOUND` | 404 | workId 不存在 |
| `WORK_NOT_REVIEWABLE` | 409 | 作品不在 under_review 状态 |
| `PUBLISH_STATUS_INVALID` | 409 | Journey publishStatus 转移非法 |

---

## 8. 风险情景卡 Risk Cards

### 8.1 GET /api/cards — 按年龄段获取卡牌（孩子端）

第1关答题器使用。

**查询参数**（`CardsQuerySchema`）：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ageStage` | enum | 是 | `ENLIGHTENMENT` / `GROWTH` / `YOUTH` |
| `riskType` | string | 否 | 过滤特定风险类型（身体安全/心理安全/社交安全/经济安全/数字权益） |

**响应体**（200）：

```typescript
{
  cards: Array<{
    cardId: string,
    riskType: string,
    scenario: string,                // 情景引导语
    eventDescription: string,        // 事件正文
    question: string,
    options: Array<{
      label: "A" | "B" | "C" | "D",
      text: string,
      consequence: string,           // 该选项的后果描述
      powerChanges: Record<string, number>
    }>,
    recommendedDemo?: string
  }>
}
```

**业务规则**：
- 按 `child.ageStage` 过滤，`status === "active"`
- 少年版（ENLIGHTENMENT/GROWTH）返回 `version === "junior"` 的卡，青春期返回 `version === "youth"`
- 第1关默认下发 8-10 张卡（前端从中随机呈现至少 6 张供答题）
- 不需要鉴权（孩子端 anonymous token 即可）

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | ageStage 缺失 |

---

### 8.2 POST /api/admin/cards — 创建/更新风险情景卡（运营端）

运营后台卡牌管理。同一端点支持新建和更新（带 `cardId` 时更新）。

**请求体**：

```typescript
{
  cardId?: string,                   // 省略=新建，存在=更新
  ageStage: "ENLIGHTENMENT" | "GROWTH" | "YOUTH",
  riskType: string,                  // 身体安全/心理安全/社交安全/经济安全/数字权益
  scenario: string,
  eventDescription: string,
  question: string,
  options: Array<{
    label: "A" | "B" | "C" | "D",
    text: string,
    consequence: string,
    powerChanges: Record<string, number>
  }>,
  recommendedDemo?: string,
  version: "youth" | "junior"        // 默认 "youth"
}
```

**响应体**（200）：

```typescript
{
  cardId: string,
  status: "active",
  createdAt: string,
  updatedAt: string
}
```

**业务规则**：
- 仅 admin 角色
- `options` 必须 4 项（A/B/C/D），其中 D 是"自创选项"
- 更新时若卡已被使用于 `cardsPlayed`，创建新版本卡并归档旧卡（`status="archived"`），不破坏历史数据
- `powerChanges` 的 key 必须是五力中文名（安全力/脑波力/实感力/创心力/沟通力）

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | options 不足 4 项 / 字段缺失 |
| `FORBIDDEN` | 403 | 非 admin |
| `NOT_FOUND` | 404 | 更新时 cardId 不存在 |

---

## 9. 伍力能量值 Energy

### 9.1 GET /api/energy/[childId] — 查询能量状态

**路径参数**：`childId`

**响应体**（`EnergyStatusResponseSchema`，200）：

```typescript
{
  childId: string,
  identity: "MEMBER" | "GUEST",
  currentEnergy: number,             // 当前余额
  totalEarned: number,               // 累计获得
  totalSpent: number                 // 累计消耗
}
```

**业务规则**：
- 权限：JWT 中的 `childId` 必须匹配，或家长查看自己孩子
- `currentEnergy` 由 `EnergyLog` 表 SUM(amount) 实时计算，或缓存于 Redis（TTL 60s）
- 创客营成员（MEMBER）开营发放初始能量（默认 20），游客（GUEST）初始 0
- 能量值不可为负，`currentEnergy < 0` 视为系统错误

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `UNAUTHORIZED` | 401 | 未登录 |
| `FORBIDDEN` | 403 | 无权查看该 child |
| `NOT_FOUND` | 404 | childId 不存在 |

---

### 9.2 POST /api/energy/deduct — 扣减能量

系统调用（AI 对话、D 选项自创时触发），不由前端直接调用。

**请求体**（`EnergyDeductRequestSchema`）：

```typescript
{
  childId: string,
  amount: number,                    // 默认 1，正整数
  reason: "TUTOR_CHAT" | "CUSTOM_D_OPTION"
}
```

**响应体**（200）：

```typescript
{
  childId: string,
  deducted: number,
  currentEnergy: number,
  logId: string                      // EnergyLog ID
}
```

**业务规则**：
- 调用方：`/api/tutor/*`（reason=TUTOR_CHAT）、`/api/journey/*/level/1`（reason=CUSTOM_D_OPTION）
- 事务：写 `EnergyLog`（amount 为负数）+ 更新 Redis 缓存
- `currentEnergy - amount < 0` 时返回 402 `ENERGY_INSUFFICIENT`，不扣减
- 游客（GUEST）调用答疑扣减时返回 403 `IDENTITY_GUEST`（前端应隐藏答疑入口）

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | amount 非正整数 |
| `ENERGY_INSUFFICIENT` | 402 | 余额不足 |
| `IDENTITY_GUEST` | 403 | 游客身份使用答疑 |
| `ENERGY_OPERATION_INVALID` | 409 | reason 非法 |

---

### 9.3 POST /api/admin/energy/supplement — 运营补充能量

运营手动给孩子加能量（如营地活动奖励、补偿）。

**请求体**（`EnergySupplementRequestSchema`）：

```typescript
{
  childId: string,
  amount: number,                    // 正整数
  reason: string,                    // 补充原因（自由文本）
  operatorId: string                 // 运营人员 ID
}
```

**响应体**（200）：

```typescript
{
  childId: string,
  supplemented: number,
  currentEnergy: number,
  logId: string
}
```

**业务规则**：
- 仅 admin 角色
- `operatorId` 必须等于当前 session 的 `user.id`，否则 403
- 单次上限 100，防止误操作
- 写 `EnergyLog`（amount 正数，`operatorId` 记录）

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | amount > 100 或非正整数 |
| `FORBIDDEN` | 403 | 非 admin / operatorId 不匹配 |
| `NOT_FOUND` | 404 | childId 不存在 |

---

## 10. 家长端 Parent

### 10.1 GET /api/parent/[parentId]/children — 家长查看孩子列表

家长登录后查看所有绑定孩子的进度概览。

**路径参数**：`parentId`

**响应体**（`ParentChildrenResponseSchema`，200）：

```typescript
{
  children: Array<{
    childId: string,
    anonymousName: string,           // 小伍创客XXXX
    ageStage: "ENLIGHTENMENT" | "GROWTH" | "YOUTH",
    currentLevel: number,            // 1-10
    currentPower: FivePower,
    badgeCount: number,              // 已获徽章数
    identity: "MEMBER" | "GUEST",
    energy: number                   // 当前能量值
  }>
}
```

**业务规则**：
- 仅家长本人可查（`session.user.id === parentId`，且 `role === "parent"`）
- 只返回 `child.parentId === parentId` 的孩子
- `currentLevel` / `currentPower` 取该 child 最近一条 ACTIVE Journey
- `badgeCount` 取该 child 的 Badge 总数

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `UNAUTHORIZED` | 401 | 未登录 |
| `FORBIDDEN` | 403 | 非 parentId 本人 |
| `NOT_FOUND` | 404 | parentId 不存在 |

---

### 10.2 POST /api/parent/confirm/[workId] — 家长确认发布

第10关发布闸口的核心动作。家长对作品发布做最终确认。

**路径参数**：`workId`

**请求体**（`ParentConfirmRequestSchema`）：

```typescript
{
  approved: boolean,
  note?: string                      // 家长备注，可选
}
```

**响应体**（200）：

```typescript
{
  workId: string,
  journeyId: string,
  parentId: string,
  approved: boolean,
  confirmedAt: string,               // ISO 8601
  journeyUpdated: {
    parentConfirm: true,
    publishStatus: "REVIEWING" | "APPROVED"   // 若运营已审核通过，则跃迁到 APPROVED
  }
}
```

**业务规则**（来自 `confirmByParent()`）：
- 权限：`session.user.id` 必须等于 `journey.child.parentId`
- 前置：`journey.publishStatus === "REVIEWING"`，否则 409 `PUBLISH_STATUS_INVALID`
- `journey.parentConfirm` 已为 true 时返回 409 `PARENT_ALREADY_CONFIRMED`
- `approved === false` 时：不写 `parentConfirm=true`，但记录 `ParentConfirmation`（approved=false），允许孩子修改后重新提交
- `approved === true` 时：
  - 写 `ParentConfirmation`（`@@unique([parentId, journeyId])`，防重复）
  - 更新 `journey.parentConfirm = true`
  - 若运营已 `APPROVE` 作品（`Work.publishStatus === "approved"`），同步 `journey.publishStatus: REVIEWING -> APPROVED`，触发徽章发放 + 作品卡生成
- 写 `JourneyLog`：`trigger="parent_confirm"`
- 事务：ParentConfirmation + Journey 更新 + JourneyLog

**错误码**：

| code | HTTP | 触发条件 |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | approved 缺失 |
| `UNAUTHORIZED` | 401 | 家长未登录 |
| `PARENT_NOT_BOUND` | 403 | 该家长未绑定此 journey 的 child |
| `PUBLISH_STATUS_INVALID` | 409 | journey 非 REVIEWING 状态 |
| `PARENT_ALREADY_CONFIRMED` | 409 | 已确认过 |
| `NOT_FOUND` | 404 | workId 不存在 |

---

## 11. 附录：错误码总表

| code | HTTP | 模块 | 含义 |
|------|------|------|------|
| `VALIDATION_ERROR` | 400 | 通用 | Zod 校验失败 |
| `UNAUTHORIZED` | 401 | 通用 | 未登录 / token 无效 |
| `FORBIDDEN` | 403 | 通用 | 权限不足 |
| `NOT_FOUND` | 404 | 通用 | 资源不存在 |
| `INTERNAL_ERROR` | 500 | 通用 | 服务器内部错误 |
| `JOURNEY_NOT_FOUND` | 404 | 旅程 | journeyId 不存在 |
| `CANNOT_SKIP_LEVEL` | 403 | 旅程 | 试图跳关 / 前置关卡未完成 |
| `LEVEL_NOT_COMPLETE` | 422 | 旅程 | 当前关产出未满足完成条件 |
| `SAFETY_CHECK_REQUIRED` | 422 | 旅程 | 需先通过第9关安全审核 |
| `PUBLISH_STATUS_INVALID` | 409 | 旅程 | publishStatus 状态不允许此操作 |
| `AI_RATE_LIMITED` | 429 | AI | AI 调用限流 |
| `AI_SAFETY_FLAG` | -- | AI | 红灯触发（通过 SSE 事件传达） |
| `ENERGY_INSUFFICIENT` | 402 | AI/能量 | 伍力能量值不足 |
| `IDENTITY_GUEST` | 403 | AI | 游客身份无法使用答疑 |
| `WORK_ALREADY_SUBMITTED` | 409 | 作品 | 作品已提交，不可重复 |
| `WORK_NOT_REVIEWABLE` | 409 | 作品 | 作品不在可审核状态 |
| `ENERGY_OPERATION_INVALID` | 409 | 能量 | 能量操作无效（reason 非法等） |
| `PARENT_NOT_BOUND` | 403 | 家长 | 家长未绑定此孩子 |
| `PARENT_ALREADY_CONFIRMED` | 409 | 家长 | 家长已确认，无需重复操作 |

---

## 12. 状态转移速查

### 12.1 Journey.publishStatus 转移图

```
                第9关通过安全审核
   DRAFT ─────────────────────────► REVIEWING
     ^                                  |
     |                                  | 运营 APPROVE + 家长确认
     | REJECTED（回到草稿修改）          v
     +---------------  REJECTED  <-- APPROVED（终态）
                       ^      |
                       |      | 重新提交
                       +------+
                  （REVIEWING -> REJECTED 由运营 REJECT 触发）
```

合法转移（来自 `ALLOWED_PUBLISH_TRANSITIONS`）：

| from | to | 触发 |
|------|----|----|
| DRAFT | REVIEWING | 第9关 advance 通过（含安全审核） |
| REVIEWING | APPROVED | 运营 APPROVE 且 `parentConfirm === true` |
| REVIEWING | REJECTED | 运营 REJECT |
| REJECTED | REVIEWING | 孩子修改后重新 `POST /api/works/submit` |
| REJECTED | DRAFT | 孩子选择回到草稿大改 |
| APPROVED | * | 不允许（终态） |

### 12.2 关卡解锁条件速查

| 关卡 | 五力 | 解锁条件 | 模板 | 强制节点 |
|------|------|---------|------|---------|
| 1 | SAFETY | 旅程开始 | A | -- |
| 2 | SAFETY | 完成第1关 | A | -- |
| 3 | SENSING | 完成第1-2关 | A | -- |
| 4 | SENSING | 完成第3关 | A | -- |
| 5 | BRAINWAVE | 完成第4关 | A | -- |
| 6 | BRAINWAVE | 完成第5关 | A | -- |
| 7 | CREATIVITY | 完成第6关 | A | -- |
| 8 | CREATIVITY | 完成第7关 | B | 工程审查 + 身体放松 checkpoint |
| 9 | COMMUNICATION | 完成第8关 | C | **安全审核强制节点** |
| 10 | COMMUNICATION | 完成第9关 + publishStatus in {REVIEWING, APPROVED} | D | 家长确认 |

---

> **文档维护约定**：
> - 改 `src/types/index.ts` 中的 Zod schema 必须同步改本文档对应章节
> - 改 `src/lib/journey/state-machine.ts` 中的转移规则必须同步改 §12
> - 新增端点必须补全：Method+Path、Request、Response、Business rules、Error codes 五节
> - 错误码新增必须登记到 §11 总表
