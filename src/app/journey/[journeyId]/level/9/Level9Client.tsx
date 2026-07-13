"use client";

import { useState } from "react";

type Level9ClientProps = {
  journeyId: string;
  demoUrl: string;
  impactContext: string;
};

export function Level9Client({ journeyId, demoUrl, impactContext }: Level9ClientProps) {
  const [realImpact, setRealImpact] = useState("");
  const [spreadImpact, setSpreadImpact] = useState("");
  const [slogan, setSlogan] = useState("");
  const [sustainedImpact, setSustainedImpact] = useState("");
  const [stakeholderAnalysis, setStakeholderAnalysis] = useState("");
  const [safetyCommitment, setSafetyCommitment] = useState(false);
  const [question, setQuestion] = useState("");
  const [tutorReply, setTutorReply] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function askTutor() {
    if (!question.trim()) return;
    setIsBusy(true);
    setStatus("小伍正在帮你把影响力说清楚...");

    try {
      const response = await fetch(`/api/tutor/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 9, message: question }),
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

  async function completeLevel9() {
    setIsBusy(true);
    setStatus("正在保存影响力方案，并生成责任检查报告...");

    try {
      const response = await fetch(`/api/journey/${journeyId}/level/9`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demoUrl: demoUrl || undefined,
          realImpact,
          spreadImpact,
          slogan,
          sustainedImpact,
          stakeholderAnalysis,
          safetyCommitment,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "第9关提交失败");
      }

      window.location.href = `/journey/${journeyId}/level/10`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "第9关提交失败");
      setIsBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      <section style={cardStyle}>
        <h2>三层影响力画布</h2>
        <p style={{ lineHeight: 1.7 }}>
          当前上下文：<strong>{impactContext}</strong>
        </p>
        {demoUrl ? (
          <p>
            Demo 链接：<a href={demoUrl} target="_blank" rel="noreferrer">{demoUrl}</a>
          </p>
        ) : null}

        <label style={labelStyle}>真实影响力<textarea value={realImpact} onChange={(event) => setRealImpact(event.target.value)} rows={4} placeholder="它真实帮助谁，解决了什么小问题？" style={textareaStyle} /></label>
        <label style={labelStyle}>传播影响力<textarea value={spreadImpact} onChange={(event) => setSpreadImpact(event.target.value)} rows={4} placeholder="你准备用什么方式让目标用户看见它？" style={textareaStyle} /></label>
        <label style={labelStyle}>一句 slogan<input value={slogan} onChange={(event) => setSlogan(event.target.value)} placeholder="例如：让每一次提醒，都变成更好的选择。" style={inputStyle} /></label>
        <label style={labelStyle}>持续影响力（可选）<textarea value={sustainedImpact} onChange={(event) => setSustainedImpact(event.target.value)} rows={3} placeholder="如果继续做，如何长期维护、迭代或形成闭环？" style={textareaStyle} /></label>
        <label style={labelStyle}>利益相关方分析（可选）<textarea value={stakeholderAnalysis} onChange={(event) => setStakeholderAnalysis(event.target.value)} rows={3} placeholder="谁会受益、谁可能受影响、谁需要被告知？" style={textareaStyle} /></label>

        <label style={checkStyle}>
          <input type="checkbox" checked={safetyCommitment} onChange={(event) => setSafetyCommitment(event.target.checked)} />
          我确认影响力描述不夸大效果，不公开隐私，并保留第10关发布前的人类确认。
        </label>

        <button type="button" onClick={completeLevel9} disabled={isBusy} style={primaryButtonStyle}>
          生成责任检查报告，进入第10关
        </button>
        {status ? <p>{status}</p> : null}
      </section>

      <aside style={cardStyle}>
        <h2>小伍影响力教练</h2>
        <p style={{ lineHeight: 1.7 }}>
          可以问：“我的 slogan 太空了吗？”或“真实影响力怎么写得更可验证？”
        </p>
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={5} placeholder="把你想传播的版本贴给小伍..." style={textareaStyle} />
        <button type="button" onClick={askTutor} disabled={isBusy} style={secondaryButtonStyle}>
          让小伍帮我打磨
        </button>
        {tutorReply ? <div style={{ marginTop: 16, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{tutorReply}</div> : null}
      </aside>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #bad6d0",
  borderRadius: 24,
  padding: 24,
  background: "rgba(255, 253, 247, 0.92)",
  boxShadow: "0 20px 60px rgba(35, 53, 52, 0.12)",
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
  border: "1px solid #bad6d0",
  borderRadius: 14,
  padding: 12,
  font: "inherit",
} as const;

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #bad6d0",
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
  background: "#1f6f68",
  color: "#fffdf7",
  cursor: "pointer",
  fontWeight: 800,
} as const;

const secondaryButtonStyle = {
  marginTop: 12,
  border: "1px solid #1f6f68",
  borderRadius: 999,
  padding: "12px 18px",
  background: "transparent",
  color: "#1f6f68",
  cursor: "pointer",
  fontWeight: 800,
} as const;
