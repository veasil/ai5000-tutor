"use client";

import { useState } from "react";

type Level7ClientProps = {
  journeyId: string;
  prepContext: string;
};

export function Level7Client({ journeyId, prepContext }: Level7ClientProps) {
  const [vision, setVision] = useState("");
  const [aiAction, setAiAction] = useState("");
  const [awareness, setAwareness] = useState("");
  const [behavior, setBehavior] = useState("");
  const [result, setResult] = useState("");
  const [demoPlan, setDemoPlan] = useState("");
  const [effectVerification, setEffectVerification] = useState("");
  const [responsibilityDecision, setResponsibilityDecision] = useState("");
  const [question, setQuestion] = useState("");
  const [tutorReply, setTutorReply] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function askTutor() {
    if (!question.trim()) return;
    setIsBusy(true);
    setStatus("小伍正在帮你把愿景变成方法...");

    try {
      const response = await fetch(`/api/tutor/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 7, message: question }),
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

  async function completeLevel7() {
    setIsBusy(true);
    setStatus("正在保存愿景与 Demo 方法...");

    try {
      const response = await fetch(`/api/journey/${journeyId}/level/7`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vision,
          aiAction,
          awareness,
          behavior,
          result,
          demoPlan,
          effectVerification,
          responsibilityDecision,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "第7关提交失败");
      }

      window.location.href = `/journey/${journeyId}/level/8`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "第7关提交失败");
      setIsBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 20 }}>
      <section style={cardStyle}>
        <h2>把愿景变成 Demo 方法</h2>
        <p style={{ lineHeight: 1.7 }}>
          你已经有了共创准备：<strong>{prepContext}</strong>。现在把它压成一句愿景，
          再用 ABC 画布规划一个可做的 Demo。
        </p>

        <label style={labelStyle}>愿景一句话<input value={vision} onChange={(event) => setVision(event.target.value)} placeholder="我希望帮助___，让他们可以___。" style={inputStyle} /></label>
        <label style={labelStyle}>AI Action<input value={aiAction} onChange={(event) => setAiAction(event.target.value)} placeholder="AI 负责提醒/分类/生成/检测/推荐什么？" style={inputStyle} /></label>
        <label style={labelStyle}>A Awareness 意识唤醒<textarea value={awareness} onChange={(event) => setAwareness(event.target.value)} rows={3} placeholder="用户先意识到什么问题？" style={textareaStyle} /></label>
        <label style={labelStyle}>B Behavior 行为干预<textarea value={behavior} onChange={(event) => setBehavior(event.target.value)} rows={3} placeholder="Demo 要推动用户做什么小行动？" style={textareaStyle} /></label>
        <label style={labelStyle}>C Result 结果验证<textarea value={result} onChange={(event) => setResult(event.target.value)} rows={3} placeholder="怎么知道这个行动有一点效果？" style={textareaStyle} /></label>
        <label style={labelStyle}>Demo 规划<textarea value={demoPlan} onChange={(event) => setDemoPlan(event.target.value)} rows={4} placeholder="最小 Demo 有哪些页面/输入/输出？第一版先做什么？" style={textareaStyle} /></label>
        <label style={labelStyle}>效果验证标准<input value={effectVerification} onChange={(event) => setEffectVerification(event.target.value)} placeholder="例如：用户能在 1 分钟内得到一条可执行建议" style={inputStyle} /></label>
        <label style={labelStyle}>责任决策点（可选）<input value={responsibilityDecision} onChange={(event) => setResponsibilityDecision(event.target.value)} placeholder="例如：如果建议可能误导用户，就显示提醒而不是直接判断" style={inputStyle} /></label>

        <button type="button" onClick={completeLevel7} disabled={isBusy} style={primaryButtonStyle}>
          保存愿景与方法，进入第8关
        </button>
        {status ? <p>{status}</p> : null}
      </section>

      <aside style={cardStyle}>
        <h2>小伍方法教练</h2>
        <p style={{ lineHeight: 1.7 }}>
          可以问：“我的 Demo 第一版太大了吗？”或“ABC 三格怎么写？”
        </p>
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={5} placeholder="把你卡住的规划问题告诉小伍..." style={textareaStyle} />
        <button type="button" onClick={askTutor} disabled={isBusy} style={secondaryButtonStyle}>
          让小伍帮我压小
        </button>
        {tutorReply ? <div style={{ marginTop: 16, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{tutorReply}</div> : null}
      </aside>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #e0c59d",
  borderRadius: 24,
  padding: 24,
  background: "rgba(255, 250, 240, 0.9)",
  boxShadow: "0 20px 60px rgba(116, 78, 26, 0.12)",
} as const;

const labelStyle = {
  display: "grid",
  gap: 8,
  marginTop: 16,
  fontWeight: 800,
} as const;

const inputStyle = {
  border: "1px solid #e0c59d",
  borderRadius: 14,
  padding: 12,
  font: "inherit",
} as const;

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #e0c59d",
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
  background: "#986b22",
  color: "#fffaf0",
  cursor: "pointer",
  fontWeight: 800,
} as const;

const secondaryButtonStyle = {
  marginTop: 12,
  border: "1px solid #986b22",
  borderRadius: 999,
  padding: "12px 18px",
  background: "transparent",
  color: "#986b22",
  cursor: "pointer",
  fontWeight: 800,
} as const;
