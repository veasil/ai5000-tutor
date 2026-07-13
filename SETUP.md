# AI5000天 AI Tutor — MVP 环境搭建指南

本指南对应当前仓库状态：静态原型仍保留，Next.js MVP 应用已经在仓库内初始化。

## 1. 安装依赖

```bash
npm install
```

## 2. 配置环境变量

```bash
cp .env.example .env.local
```

至少需要配置：

- `DATABASE_URL`：PostgreSQL 连接串。只跑 `next build` 可以用本地假连接串；真实运行写库必须填真实库。
- `NEXT_PUBLIC_WQT_LEVEL1_URL`：第 1 关 iframe 嵌入的 WQT 页面。
- `WQT_CALLBACK_SECRET`：可选。配置后，WQT server callback 必须带 `X-WQT-Callback-Secret`。
- `ANTHROPIC_API_KEY`：可选。未配置时 AI Tutor 返回本地 fallback 引导语。

## 3. 初始化 Prisma

```bash
npm run prisma:generate
npm run prisma:validate
```

首次部署到真实 PostgreSQL：

```bash
npm run db:migrate
```

开发期如果只想快速同步 schema：

```bash
npm run db:push
```

## 4. 启动开发服务

```bash
npm run dev
```

访问：

- `http://localhost:3000/`：MVP 首页
- `http://localhost:3000/api/health`：健康检查
- `http://localhost:3000/journey/{journeyId}/level/1`：第 1 关 WQT 嵌入页

首页的“开始 MVP 闯关”按钮会依次调用：

1. `POST /api/auth/anonymous`
2. `POST /api/journey/start`
3. 跳转到 `/journey/{journeyId}/level/1`

## 5. WQT 完成回调

第 1 关完成后，WQT 可以通过浏览器 `postMessage` 或 server callback 通知 AI Tutor。

AI Tutor 的 iframe 嵌入页会给 WQT URL 自动追加：

- `journeyId`：当前 AI Tutor 旅程 ID
- `aitutor_origin`：父页面 origin，供 WQT `postMessage` 指定目标 origin

AI Tutor 端点：

```http
POST /api/wqt/level1/complete
```

请求体：

```json
{
  "journeyId": "cl...",
  "wqtSessionId": "123",
  "reviewSnapshot": {
    "session": {},
    "cards": [],
    "skills": [],
    "durationMs": null
  },
  "reportUrl": "https://..."
}
```

如果配置了 `WQT_CALLBACK_SECRET`，请求头必须包含：

```http
X-WQT-Callback-Secret: <secret>
```

## 6. 验证命令

提交前至少运行：

```bash
npm run prisma:validate
npm run build
git diff --check
```

## 7. 当前 MVP 边界

已经实现：

- Next.js App Router 应用壳
- Prisma schema + 初始 migration
- 匿名 Child 创建
- Journey 创建
- 第 1 关 WQT 嵌入与完成回调
- 第 1 关完成后保存 WQT session/review 快照并推进状态机
- 第 2 关责任议题锁定最小页面与推进端点
- 第 3-10 关通用占位页，避免推进后 404
- 最小 AI Tutor JSON 接口

仍待实现：

- 完整 JWT/NextAuth 会话与权限中间件
- 第 3-10 关真实交互页面
- AI Tutor 流式 SSE 与结构化输出回填
- WQT 端正式 postMessage/server callback 配合
- 家长端、运营端、作品发布审核
