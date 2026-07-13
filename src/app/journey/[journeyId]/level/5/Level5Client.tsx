"use client";

import { useState } from "react";

type Level5ClientProps = {
  journeyId: string;
  issueContext: string;
};

export function Level5Client({ journeyId, issueContext }: Level5ClientProps) {
  const [mechanismDescription, setMechanismDescription] = useState("");
  const [aiCanDoText, setAiCanDoText] = useState("");
  const [aiCannotDoText, setAiCannotDoText] = useState("");
  const [analogyDescription, setAnalogyDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [tutorReply, setTutorReply] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function askTutor() {
    if (!question.trim()) return;
    setIsBusy(true);
    setStatus("小伍正在帮你拆 AI 机制...");

    try {
      const response = await fetch(`/api/tutor/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 5, message: question }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "小伍暂时回答不了");
      }
      setTutorReply(result.data.text);
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "小伍暂时回答不了");
    } finally {
      setIsBusy(false);
    }
  }

  async function completeLevel5() {
    setIsBusy(true);
    setStatus("正在保存 AI 机制拆解...");

    try {
      const response = await fetch(`/api/journey/${journeyId}/level/5`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mechanismDescription,
          aiCanDoText,
          aiCannotDoText,
          analogyDescription,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "第5关提交失败");
      }

      window.location.href = `/journey/${journeyId}/level/6`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "第5关提交失败");
      setIsBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 20 }}>
      <section style={cardStyle}>
        <h2>拆开 AI 在这件事里的作用</h2>
        <p style={{ lineHeight: 1.7 }}>
          你前面找到的切入点是：<strong>{issueContext}</strong>。现在先用自己的话解释：
          AI 可能在哪里参与、帮什么忙、又不能替人负责什么。
        </p>

        <label style={labelStyle}>
          AI 机制描述（至少 10 个字）
          <textarea
            value={mechanismDescription}
            onChange={(event) => setMechanismDescription(event.target.value)}
            rows={5}
            placeholder="例如：平台会根据用户停留时间和点击行为继续推荐相似内容，让人更难停下来。"
            style={textareaStyle}
          />
        </label>

        <label style={labelStyle}>
          AI 能做什么？每行一个
          <textarea
            value={aiCanDoText}
            onChange={(event) => setAiCanDoText(event.target.value)}
            rows={4}
            placeholder={"提醒使用时长\n识别重复刷屏行为\n推荐更健康的替代活动"}
            style={textareaStyle}
          />
        </label>

        <label style={labelStyle}>
          AI 不能做什么？每行一个
          <textarea
            value={aiCannotDoText}
            onChange={(event) => setAiCannotDoText(event.target.value)}
            rows={4}
            placeholder={"不能替孩子做决定\n不能保证所有推荐都健康\n不能收集隐私来换效果"}
            style={textareaStyle}
          />
        </label>

        <label style={labelStyle}>
          用一个比喻解释这个机制（可选）
          <input
            value={analogyDescription}
            onChange={(event) => setAnalogyDescription(event.target.value)}
            placeholder="例如：像一个越看越懂你口味、但不一定懂你健康的零食店老板"
            style={inputStyle}
          />
        </label>

        <button type="button" onClick={completeLevel5} disabled={isBusy} style={primaryButtonStyle}>
          保存 AI 机制拆解，进入第6关
        </button>
        {status ? <p>{status}</p> : null}
      </section>

      <aside style={cardStyle}>
        <h2>小伍机制教练</h2>
        <p style={{ lineHeight: 1.7 }}>
          可以问：“这个问题背后可能用了哪种 AI？”或“AI 不能负责什么？”
        </p>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={5}
          placeholder="把你不懂的 AI 机制告诉小伍..."
          style={textareaStyle}
        />
        <button type="button" onClick={askTutor} disabled={isBusy} style={secondaryButtonStyle}>
          让小伍讲给我听
        </button>
        {tutorReply ? (
          <div style={{ marginTop: 16, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
            {tutorReply}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #b9c7d8",
  borderRadius: 24,
  padding: 24,
  background: "rgba(250, 253, 255, 0.9)",
  boxShadow: "0 20px 60px rgba(28, 54, 86, 0.12)",
} as const;

const labelStyle = {
  display: "grid",
  gap: 8,
  marginTop: 16,
  fontWeight: 800,
} as const;

const inputStyle = {
  border: "1px solid #b9c7d8",
  borderRadius: 14,
  padding: 12,
  font: "inherit",
} as const;

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #b9c7d8",
  borderRadius: 14,
  padding: 12,
  font: "inherit",
  resize: "vertical",
} as const;

const primaryButtonStyle = {
  marginTop: 20,
  border: "none",
  borderRadius: 999,
  padding: "14px 22px",
  background: "#254d78",
  color: "#fafdff",
  cursor: "pointer",
  fontWeight: 800,
} as const;

const secondaryButtonStyle = {
  marginTop: 12,
  border: "1px solid #254d78",
  borderRadius: 999,
  padding: "12px 18px",
  background: "transparent",
  color: "#254d78",
  cursor: "pointer",
  fontWeight: 800,
} as const;
