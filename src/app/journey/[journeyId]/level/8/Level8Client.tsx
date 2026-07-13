"use client";

import { useState } from "react";

type Level8ClientProps = {
  journeyId: string;
  demoContext: string;
};

export function Level8Client({ journeyId, demoContext }: Level8ClientProps) {
  const [demoUrl, setDemoUrl] = useState("");
  const [iterationChanges, setIterationChanges] = useState("");
  const [iterationTestResult, setIterationTestResult] = useState("");
  const [responsibilityReview, setResponsibilityReview] = useState("");
  const [engineeringCheckpoint, setEngineeringCheckpoint] = useState(false);
  const [bodyRelaxCheckpoint, setBodyRelaxCheckpoint] = useState(false);
  const [edgeOneAssetId, setEdgeOneAssetId] = useState("");
  const [question, setQuestion] = useState("");
  const [tutorReply, setTutorReply] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function askTutor() {
    if (!question.trim()) return;
    setIsBusy(true);
    setStatus("小伍正在帮你检查 Demo...");

    try {
      const response = await fetch(`/api/tutor/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 8, message: question }),
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

  async function completeLevel8() {
    setIsBusy(true);
    setStatus("正在保存 Demo 工坊记录...");

    try {
      const response = await fetch(`/api/journey/${journeyId}/level/8`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demoUrl,
          iterationChanges,
          iterationTestResult,
          responsibilityReview,
          engineeringCheckpoint,
          bodyRelaxCheckpoint,
          edgeOneAssetId,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "第8关提交失败");
      }

      window.location.href = `/journey/${journeyId}/level/9`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "第8关提交失败");
      setIsBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 20 }}>
      <section style={cardStyle}>
        <h2>提交你的最小 Demo</h2>
        <p style={{ lineHeight: 1.7 }}>
          你的 Demo 蓝图是：<strong>{demoContext}</strong>。MVP 版本先支持粘贴一个可访问链接，
          后面再接一键部署。
        </p>

        <label style={labelStyle}>Demo URL<input value={demoUrl} onChange={(event) => setDemoUrl(event.target.value)} placeholder="https://..." style={inputStyle} /></label>
        <label style={labelStyle}>这次迭代改了什么？<textarea value={iterationChanges} onChange={(event) => setIterationChanges(event.target.value)} rows={4} placeholder="例如：完成输入框、提醒文案和结果展示。" style={textareaStyle} /></label>
        <label style={labelStyle}>你怎么测试它？<textarea value={iterationTestResult} onChange={(event) => setIterationTestResult(event.target.value)} rows={4} placeholder="例如：用 3 个真实场景测试，用户能得到清楚提醒。" style={textareaStyle} /></label>
        <label style={labelStyle}>责任审查记录<textarea value={responsibilityReview} onChange={(event) => setResponsibilityReview(event.target.value)} rows={4} placeholder="检查隐私、安全、误导、沉迷、退出选择等风险。" style={textareaStyle} /></label>
        <label style={labelStyle}>EdgeOne 资产 ID（可选）<input value={edgeOneAssetId} onChange={(event) => setEdgeOneAssetId(event.target.value)} placeholder="如果已经部署，可填资产 ID" style={inputStyle} /></label>

        <label style={checkStyle}>
          <input type="checkbox" checked={engineeringCheckpoint} onChange={(event) => setEngineeringCheckpoint(event.target.checked)} />
          我确认 Demo 链接能打开，核心流程能跑完。
        </label>
        <label style={checkStyle}>
          <input type="checkbox" checked={bodyRelaxCheckpoint} onChange={(event) => setBodyRelaxCheckpoint(event.target.checked)} />
          我已经停下来休息并重新检查，不在疲劳状态下硬发布。
        </label>

        <button type="button" onClick={completeLevel8} disabled={isBusy} style={primaryButtonStyle}>
          保存 Demo 工坊记录，进入第9关
        </button>
        {status ? <p>{status}</p> : null}
      </section>

      <aside style={cardStyle}>
        <h2>小伍 Demo 教练</h2>
        <p style={{ lineHeight: 1.7 }}>
          可以问：“我的 Demo 还缺哪个最小流程？”或“责任审查怎么写？”
        </p>
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={5} placeholder="把你 Demo 的卡点告诉小伍..." style={textareaStyle} />
        <button type="button" onClick={askTutor} disabled={isBusy} style={secondaryButtonStyle}>
          让小伍帮我检查
        </button>
        {tutorReply ? <div style={{ marginTop: 16, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{tutorReply}</div> : null}
      </aside>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #cabce0",
  borderRadius: 24,
  padding: 24,
  background: "rgba(252, 249, 255, 0.92)",
  boxShadow: "0 20px 60px rgba(63, 45, 91, 0.12)",
} as const;

const labelStyle = {
  display: "grid",
  gap: 8,
  marginTop: 16,
  fontWeight: 800,
} as const;

const checkStyle = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  marginTop: 16,
  fontWeight: 800,
  lineHeight: 1.6,
} as const;

const inputStyle = {
  border: "1px solid #cabce0",
  borderRadius: 14,
  padding: 12,
  font: "inherit",
} as const;

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cabce0",
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
  background: "#654997",
  color: "#fcf9ff",
  cursor: "pointer",
  fontWeight: 800,
} as const;

const secondaryButtonStyle = {
  marginTop: 12,
  border: "1px solid #654997",
  borderRadius: 999,
  padding: "12px 18px",
  background: "transparent",
  color: "#654997",
  cursor: "pointer",
  fontWeight: 800,
} as const;
