"use client";

import { useState } from "react";

type Level10ClientProps = {
  journeyId: string;
  demoUrl: string;
  slogan: string;
  publishContext: string;
};

export function Level10Client({ journeyId, demoUrl, slogan, publishContext }: Level10ClientProps) {
  const [title, setTitle] = useState(slogan || "");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [audience, setAudience] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [responsibilityStatement, setResponsibilityStatement] = useState("");
  const [workCardReady, setWorkCardReady] = useState(false);
  const [allChecksPassed, setAllChecksPassed] = useState(false);
  const [parentConfirm, setParentConfirm] = useState(false);
  const [question, setQuestion] = useState("");
  const [tutorReply, setTutorReply] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function askTutor() {
    if (!question.trim()) return;
    setIsBusy(true);
    setStatus("小伍正在帮你排练发布会...");

    try {
      const response = await fetch(`/api/tutor/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 10, message: question }),
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

  async function completeLevel10() {
    setIsBusy(true);
    setStatus("正在生成作品卡与负责任开发者徽章...");

    try {
      const response = await fetch(`/api/journey/${journeyId}/level/10`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          problem,
          solution,
          audience,
          videoUrl,
          responsibilityStatement,
          workCardReady,
          allChecksPassed,
          parentConfirm,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "第10关提交失败");
      }

      window.location.href = `/journey/${journeyId}/level/10`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "第10关提交失败");
      setIsBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      <section style={cardStyle}>
        <h2>发布会脚本与作品卡</h2>
        <p style={{ lineHeight: 1.7 }}>
          当前上下文：<strong>{publishContext}</strong>
        </p>
        {demoUrl ? (
          <p>
            Demo 链接：<a href={demoUrl} target="_blank" rel="noreferrer">{demoUrl}</a>
          </p>
        ) : null}

        <label style={labelStyle}>作品卡标题<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="给你的作品起一个清楚的名字" style={inputStyle} /></label>
        <label style={labelStyle}>我看到的问题<textarea value={problem} onChange={(event) => setProblem(event.target.value)} rows={3} placeholder="我看到___遇到了___问题。" style={textareaStyle} /></label>
        <label style={labelStyle}>所以我做了<textarea value={solution} onChange={(event) => setSolution(event.target.value)} rows={3} placeholder="所以我做了一个___，它可以___。" style={textareaStyle} /></label>
        <label style={labelStyle}>它能帮助谁<textarea value={audience} onChange={(event) => setAudience(event.target.value)} rows={3} placeholder="它能帮助___在___场景下___。" style={textareaStyle} /></label>
        <label style={labelStyle}>发布会视频 URL<input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://... 或内部视频记录链接" style={inputStyle} /></label>
        <label style={labelStyle}>责任声明<textarea value={responsibilityStatement} onChange={(event) => setResponsibilityStatement(event.target.value)} rows={4} placeholder="我确认这个作品不会公开隐私，不夸大效果，并保留人工判断。" style={textareaStyle} /></label>

        <label style={checkStyle}>
          <input type="checkbox" checked={workCardReady} onChange={(event) => setWorkCardReady(event.target.checked)} />
          我确认作品卡信息已经准备好，可以生成 MVP 作品卡。
        </label>
        <label style={checkStyle}>
          <input type="checkbox" checked={allChecksPassed} onChange={(event) => setAllChecksPassed(event.target.checked)} />
          我确认 Demo、视频、责任声明和安全自检都已通过 MVP 发布闸口。
        </label>
        <label style={checkStyle}>
          <input type="checkbox" checked={parentConfirm} onChange={(event) => setParentConfirm(event.target.checked)} />
          MVP 临时家长确认：发布前已经获得监护人同意，后续会替换为独立家长端确认。
        </label>

        <button type="button" onClick={completeLevel10} disabled={isBusy} style={primaryButtonStyle}>
          生成作品卡，点亮徽章
        </button>
        {status ? <p>{status}</p> : null}
      </section>

      <aside style={cardStyle}>
        <h2>小伍发布会教练</h2>
        <p style={{ lineHeight: 1.7 }}>
          可以问：“我这段发布会脚本够短吗？”或“责任声明怎么更像孩子自己说的话？”
        </p>
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={5} placeholder="把你的发布会稿子贴给小伍..." style={textareaStyle} />
        <button type="button" onClick={askTutor} disabled={isBusy} style={secondaryButtonStyle}>
          让小伍帮我排练
        </button>
        {tutorReply ? <div style={{ marginTop: 16, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{tutorReply}</div> : null}
      </aside>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #d8c1ad",
  borderRadius: 24,
  padding: 24,
  background: "rgba(255, 252, 248, 0.92)",
  boxShadow: "0 20px 60px rgba(43, 51, 64, 0.12)",
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
  border: "1px solid #d8c1ad",
  borderRadius: 14,
  padding: 12,
  font: "inherit",
} as const;

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d8c1ad",
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
  background: "#b25f32",
  color: "#fffaf5",
  cursor: "pointer",
  fontWeight: 800,
} as const;

const secondaryButtonStyle = {
  marginTop: 12,
  border: "1px solid #b25f32",
  borderRadius: 999,
  padding: "12px 18px",
  background: "transparent",
  color: "#b25f32",
  cursor: "pointer",
  fontWeight: 800,
} as const;
