# AI5000天 · 负责任开发者 AI Tutor

面向 6-15 岁儿童青少年的闯关式 AI 创客训练系统。孩子通过五力框架（安全力觉醒 -> 脑波力启蒙 -> 实感力锻造 -> 创心力迸发 -> 沟通力绽放）完成 10 关，最终生成一个 AI 作品并发布。

当前仓库已经从纯静态原型推进到 MVP 应用骨架：

- 静态交互原型：`index.html`、`map.html`、`level1.html` 到 `level10.html`、`works.html`、`states.html`
- Next.js MVP：匿名创建、旅程创建、第 1 关 WQT 嵌入与完成回调、最小 AI Tutor JSON 接口
- 数据库模型：PostgreSQL + Prisma，包含 WQT session/review 快照字段

## 在线预览

静态原型：<https://veasil.github.io/ai5000-tutor/>

## 本地运行 MVP

```bash
npm install
cp .env.example .env.local
npm run prisma:generate
npm run dev
```

如果要连接真实 PostgreSQL：

```bash
# 先在 .env.local 填好 DATABASE_URL
npm run db:migrate
npm run dev
```

开发时没有 `ANTHROPIC_API_KEY` 也可以运行，`/api/tutor/[journeyId]` 会返回本地 fallback 引导语。

## 关键路径

- 首页启动按钮：`src/app/page.tsx`
- 匿名创建：`src/app/api/auth/anonymous/route.ts`
- 旅程创建：`src/app/api/journey/start/route.ts`
- 第 1 关 WQT 嵌入：`src/app/journey/[journeyId]/level/1/page.tsx`
- WQT 完成回调：`src/app/api/wqt/level1/complete/route.ts`
- 最小 AI Tutor：`src/app/api/tutor/[journeyId]/route.ts`
- 状态机：`src/lib/journey/state-machine.ts`
- Prisma schema：`prisma/schema.prisma`

## WQT 集成约定

WQT 继续作为第 1 关卡牌事实源，负责卡牌数据、选择记录、计分反馈、计分界面和复盘网页。AI Tutor 只保存引用和快照：

- `Journey.wqtSessionId` = WQT 的 `game_sessions.id`
- `Journey.wqtReviewSnapshot` = WQT 复盘快照
- `Journey.wqtReviewReportUrl` = WQT 生成的复盘网页
- `cardsPlayed` 和 `top3Concerns` 是 AI Tutor 为状态机派生出的兼容字段

## 文档

- `CLAUDE.md`：项目知识库和工程约定
- `SETUP.md`：环境搭建与部署说明
- `docs/api-design.md`：API 契约
