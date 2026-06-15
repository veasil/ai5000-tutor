# AI5000天 负责任开发者 AI Tutor — 项目知识库

> 此文件由 Claude 维护。每次新开 Claude Code session 必须先 @ 此文件。
> 修复 bug 后说"记录一下"即可追加踩坑记录。

---

## 项目简介

**AI5000天 负责任开发者 AI Tutor**
面向6-15岁儿童青少年的闯关式 AI 创客训练系统。孩子通过五力框架（安全力觉醒→脑波力启蒙→实感力锻造→创心力迸发→沟通力绽放）完成10关，最终生成一个 AI 作品并发布。

配套线下青少年 AI 创客营使用，机构/学校通过 organization_id 与第一个项目（wqt-auth-backend）关联。

---

## 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 框架 | Next.js 15 App Router | 全栈，Server Actions 驱动状态机 |
| 数据库 | PostgreSQL 16 + Prisma ORM | Zeabur 原生托管，migration 可控 |
| 认证 | NextAuth v5 | 支持匿名 child session + 家长账号 |
| AI 调用 | Anthropic SDK (`@anthropic-ai/sdk`) | 统一封装在 `lib/ai/`，禁止在其他地方直接 fetch |
| 验证 | Zod（前后端共用） | 所有 Server Action 入参必须经过 Zod 校验 |
| 样式 | Tailwind CSS + shadcn/ui | |
| 缓存/队列 | Redis (Zeabur) + BullMQ | 对话 session 缓存、审核异步队列 |
| 监控 | Sentry（前后端同时接） | 第一天接入 |

---

## 目录结构

```
src/
├── app/
│   ├── (auth)/                  # 登录/注册（家长、机构）
│   ├── (child)/                 # 孩子端主流程
│   │   ├── layout.tsx
│   │   ├── journey/
│   │   │   └── [journeyId]/
│   │   │       ├── level/
│   │   │       │   └── [level]/ # 每关页面
│   │   │       └── page.tsx     # 旅程概览
│   │   └── works/               # 孩子的作品展示
│   ├── (parent)/                # 家长端
│   │   └── dashboard/
│   ├── (admin)/                 # 运营后台
│   │   ├── works/               # 作品审核
│   │   ├── cards/               # 风险情景卡管理
│   │   └── settings/
│   └── api/
│       ├── auth/                # NextAuth endpoints
│       ├── journey/             # 状态机推进
│       ├── tutor/               # AI Tutor 对话（流式）
│       ├── cards/               # 风险情景卡
│       ├── demo/                # Demo 模板生成
│       ├── safety/              # 发布前审核
│       └── works/               # 作品发布
├── lib/
│   ├── ai/
│   │   ├── client.ts            # Anthropic SDK 单例，含 token 追踪
│   │   ├── prompts/
│   │   │   ├── system.ts        # 小伍人格 system prompt
│   │   │   ├── stages/          # 每关的 stage prompt
│   │   │   └── guardrails.ts    # 安全红线 prompt
│   │   ├── safety.ts            # 红灯检测逻辑
│   │   └── streaming.ts         # 流式输出统一处理
│   ├── db/
│   │   └── index.ts             # Prisma client 单例
│   ├── auth/
│   │   └── config.ts            # NextAuth 配置
│   └── journey/
│       ├── state-machine.ts     # 五力状态机核心逻辑
│       └── level-configs.ts     # 每关的任务定义和输出字段
├── components/
│   ├── journey/                 # 闯关 UI 组件
│   ├── tutor/                   # AI Tutor 对话 UI
│   └── ui/                      # shadcn 基础组件
└── types/
    └── index.ts                 # 全局类型定义（与 Prisma schema 对齐）
```

---

## 数据库 Schema（当前）

详见 `prisma/schema.prisma`。核心表关系：

```
Parent ──< Child ──< Journey ──< JourneyLog
                          │───< Conversation
                          └──── Work
                          └──── Badge

RiskCard（风险情景卡，运营管理）
DemoTemplate（Demo 模板，运营管理）
```

### Journey 状态机字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `currentPower` | enum FivePower | 当前五力阶段 |
| `currentLevel` | Int 1-10 | 当前关卡 |
| `completedLevels` | Int[] | 已完成关卡列表 |
| `publishStatus` | enum | draft/reviewing/approved/rejected |
| `safetyFlags` | Json | 触发过的红灯记录 |
| `parentConfirm` | Boolean | 家长是否确认发布 |

关卡与五力对应：
- 安全力觉醒：第1关（风险冒险局）、第2关（议题锁定）、第9关（责任检查站）
- 脑波力启蒙：第3关、第4关
- 实感力锻造：第5关、第6关
- 创心力迸发：第7关、第8关
- 沟通力绽放：第10关

---

## 关键 API 端点

```
认证：
  POST /api/auth/[...nextauth]   NextAuth 标准端点
  POST /api/auth/anonymous       创建匿名 child session

旅程（Journey）：
  POST /api/journey/start        创建新旅程，返回 journeyId
  GET  /api/journey/[id]         获取旅程当前状态
  POST /api/journey/[id]/advance 推进到下一关（含 Zod 校验）
  POST /api/journey/[id]/save    保存当前关卡字段（不推进）

AI Tutor 对话：
  POST /api/tutor/[journeyId]    流式对话，返回 text + structuredOutput
  ⚠️ 此端点必须包含当前 level、journeyState 作为上下文

风险情景卡：
  GET  /api/cards?ageStage=X     按年龄段获取卡牌（孩子端）
  POST /api/admin/cards          管理端 CRUD

Demo 生成：
  POST /api/demo/generate        根据 abc_canvas + issue 匹配模板生成
  GET  /api/demo/templates       获取模板列表

安全审核：
  POST /api/safety/check         发布前检查（第9关强制调用）

作品发布：
  POST /api/works/submit         提交审核
  GET  /api/admin/works          运营审核列表
  PUT  /api/admin/works/[id]     审核通过/驳回
```

---

## AI Tutor 关键约定

### ⚠️ 所有 AI 调用必须通过 `lib/ai/client.ts`

禁止在 Route Handler 或 Server Action 里直接 `new Anthropic()`。
`client.ts` 统一处理：token 计数、限流、错误重试、流式输出格式。

### Prompt 分层结构

```typescript
// 每次调用 AI Tutor 的消息构造顺序：
1. system.ts        → 小伍身份、儿童友好、安全红线
2. stages/level-N.ts → 本关目标、提问顺序、输出字段定义
3. guardrails.ts    → 隐私/危险行为检查规则
// 然后拼接对话历史（从 Conversation 表取，最近 20 条）
```

### 结构化输出约定

每轮 AI 回复必须同时输出：
- `text`：孩子看到的对话文本
- `structuredOutput`：本轮提取的字段（JSON），直接写入 Journey 对应字段

AI 被要求以 JSON 结尾，前端从流中解析最后的 JSON block。

### 红灯机制

`lib/ai/safety.ts` 在每次用户输入和 AI 输出前双向检查。
触发红灯时：
1. 立即停止普通流程
2. 写入 `journey.safetyFlags`
3. 返回安全提示文案（不走正常 stage prompt）
4. 自伤/威胁类：直接跳出对话，显示求助资源

红灯触发词类型：自伤、被威胁、真实姓名/地址/电话、账号密码、API Key。

---

## 项目关键约定

### 时间戳
全库统一用 `DateTime`（Prisma 默认 ISO 8601），禁止存毫秒时间戳（与第一个项目不同）。

### 匿名 ID 规则
孩子端 `anonymousName` 由系统生成，格式：`小伍创客[4位随机数字]`。
不收集真实姓名、学校、班级、地址、精确定位。

### 状态机不可跳关
`state-machine.ts` 中 `advanceLevel` 函数必须校验：
- `currentLevel` 的前置关卡已完成
- 第1-2关未完成，不允许跳到第3关以后
- 第9关（安全检查）是发布前强制节点，`publishStatus` 只有在第9关通过后才能从 `draft` 变为 `reviewing`

### Zod schema 共用
`types/index.ts` 中定义的 Zod schema 同时用于：
- Server Action 入参校验
- 前端表单校验
- AI 结构化输出的 parse

### Server Action 错误处理模板
```typescript
// 所有 Server Action 统一返回格式
type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }
```

---

## Zeabur 部署结构

```
Project: ai5000-tutor
├── web      Next.js（main app）
├── postgres PostgreSQL 16
└── redis    Redis 7
```

环境变量（`.env.example` 有完整列表）：
- `DATABASE_URL`：Zeabur postgres 连接串
- `REDIS_URL`：Zeabur redis 连接串
- `ANTHROPIC_API_KEY`：AI 调用密钥（⚠️ 绝不提交，绝不出现在前端）
- `NEXTAUTH_SECRET`：随机生成
- `NEXTAUTH_URL`：生产域名

---

## 与第一个项目（wqt-auth-backend）的关系

- **账号体系独立**：AI Tutor 有自己的 Child/Parent 表，不共用 wqt.db
- **机构关联**：`Child.organizationId` 存储 wqt-auth-backend 的 `organizations.id`，用于线下营地管理员查看孩子进度
- **数据不互通**：两个项目各自独立数据库，通过 organizationId 做软关联

---

## 踩坑记录

<!-- entries below -->
