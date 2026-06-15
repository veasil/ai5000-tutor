# AI5000天 AI Tutor — 环境搭建指南

## 第一步：新建 Next.js 项目

```bash
npx create-next-app@latest ai5000-tutor \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd ai5000-tutor
```

## 第二步：安装依赖

```bash
# 核心依赖
npm install @prisma/client @anthropic-ai/sdk next-auth@beta zod

# 开发依赖
npm install -D prisma

# UI 组件
npx shadcn@latest init
```

## 第三步：初始化 Prisma

```bash
# 把 prisma/schema.prisma 放入项目根目录后
npx prisma generate
```

## 第四步：配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local，填入真实值
```

## 第五步：Zeabur 创建服务

在 Zeabur 控制台：
1. 新建 Project：`ai5000-tutor`
2. 添加 PostgreSQL 服务 → 复制 `DATABASE_URL` 到 `.env.local`
3. 添加 Redis 服务 → 复制 `REDIS_URL` 到 `.env.local`
4. 添加 Next.js 服务（连接 GitHub 仓库，自动部署）

## 第六步：首次数据库迁移

```bash
# 确认 DATABASE_URL 已填写
npx prisma migrate dev --name init
```

## 第七步：把骨架文件放入项目

按以下路径放置本目录提供的文件：

```
项目根目录/
├── CLAUDE.md                        ← 直接放根目录
├── prisma/
│   └── schema.prisma                ← 替换 create-next-app 生成的空文件
├── .env.example                     ← 放根目录
└── src/
    └── lib/
        ├── ai/
        │   ├── client.ts
        │   └── safety.ts
        ├── db/
        │   └── index.ts
        └── journey/
            └── state-machine.ts
```

## 第八步：接下来要创建的文件（按优先级）

交给 Claude Code 逐步完成，每次 @ CLAUDE.md：

### P0 本周必须有

```
src/lib/ai/prompts/
├── system.ts          # 小伍人格 system prompt
├── stages/
│   ├── level-1.ts     # 小伍风险冒险局
│   ├── level-2.ts     # 责任议题锁定
│   └── ...
└── guardrails.ts      # 安全红线 prompt

src/app/api/
├── journey/
│   ├── route.ts       # POST 创建旅程
│   └── [id]/
│       ├── route.ts   # GET 旅程状态
│       └── advance/route.ts  # POST 推进关卡
└── tutor/
    └── [journeyId]/
        └── route.ts   # POST 流式对话

src/app/(child)/
└── journey/
    └── [journeyId]/
        └── level/
            └── [level]/
                └── page.tsx
```

### P1 下一步

```
src/app/(admin)/       # 运营后台
src/app/(parent)/      # 家长端
src/app/api/works/     # 作品审核
src/app/api/safety/    # 发布前检查
```

---

## 给 Claude Code 的工作方式

每次新开 session：
```
@CLAUDE.md 现在要实现 [具体功能]，请先确认你已读完 CLAUDE.md 再开始。
```

每次修完 bug：
```
记录一下：[现象] [根因] [修复]
```

---

## 注意事项

- **SQLite 已被废弃**：第一个项目用了 SQLite，本项目统一用 PostgreSQL
- **不要用 localStorage 存游戏状态**：第一个项目踩过这个坑（多标签页串号），所有旅程状态存数据库
- **AI 调用只走 `lib/ai/client.ts`**：禁止在 Route Handler 里直接 `new Anthropic()`
- **Zod 校验是必须的**：所有 Server Action 入参必须 Zod parse，不要信任前端传的任何数据
