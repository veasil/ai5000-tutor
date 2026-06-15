# AI5000天 · 负责任开发者 AI Tutor

面向 6-15 岁儿童青少年的闯关式 AI 创客训练系统。孩子通过五力框架（安全力觉醒 → 脑波力启蒙 → 实感力锻造 → 创心力迸发 → 沟通力绽放）完成 10 关，最终生成一个 AI 作品并发布。

## 🔗 在线预览（v0.1）

孩子端·闯关首页静态预览：**https://veasil.github.io/ai5000-tutor/**

> 当前为 `front-design.pen` 设计稿手工还原的静态 HTML 首页，仅作视觉预览。后续接入 Next.js 真实前端后会替换此页面。

## 技术栈

Next.js 15 (App Router) · PostgreSQL 16 + Prisma · NextAuth v5 · Anthropic SDK · Zod · Tailwind + shadcn/ui · Redis + BullMQ · Sentry

详见 [`CLAUDE.md`](./CLAUDE.md)（项目知识库）与 [`SETUP.md`](./SETUP.md)。

## 目录

- `index.html` — v0.1 闯关首页静态预览（GitHub Pages 入口）
- `assets/` — 首页所用图片资源
- `front-design.pen` — Pencil 设计源文件
- `docs/` — 设计文档
- `schema.prisma` / `state-machine.ts` / `safety.ts` / `client.ts` — 后端核心（早期脚手架）
