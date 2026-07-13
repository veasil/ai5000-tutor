"use client";

import { useState } from "react";

type Level4ClientProps = {
  journeyId: string;
  storySummary: string;
};

export function Level4Client({ journeyId, storySummary }: Level4ClientProps) {
  const [surfaceDescription, setSurfaceDescription] = useState("");
  const [stakeholdersText, setStakeholdersText] = useState("");
  const [rootCausesText, setRootCausesText] = useState("");
  const [previousWho, setPreviousWho] = useState("");
  const [previousWhat, setPreviousWhat] = useState("");
  const [previousWhyFailed, setPreviousWhyFailed] = useState("");
  const [entryWindow, setEntryWindow] = useState("");
  const [question, setQuestion] = useState("");
  const [tutorReply, setTutorReply] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function askTutor() {
    if (!question.trim()) return;
    setIsBusy(true);
    setStatus("小伍正在帮你拆冰山...");

    try {
      const response = await fetch(`/api/tutor/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 4, message: question }),
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

  async function completeLevel4() {
    setIsBusy(true);
    setStatus("正在保存问题侦探卡...");

    try {
      const response = await fetch(`/api/journey/${journeyId}/level/4`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surfaceDescription,
          stakeholdersText,
          rootCausesText,
          previousWho,
          previousWhat,
          previousWhyFailed,
          entryWindow,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "第4关提交失败");
      }

      window.location.href = `/journey/${journeyId}/level/5`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "第4关提交失败");
      setIsBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 20 }}>
      <section style={cardStyle}>
        <h2>把故事拆成问题冰山</h2>
        <p style={{ lineHeight: 1.7 }}>
          上一关的故事线索：<strong>{storySummary}</strong>
        </p>

        <label style={labelStyle}>
          表面上大家看见了什么？
          <textarea
            value={surfaceDescription}
            onChange={(event) => setSurfaceDescription(event.target.value)}
            rows={3}
            placeholder="例如：同学总是在睡前刷短视频，第二天精神很差"
            style={textareaStyle}
          />
        </label>

        <label style={labelStyle}>
          牵涉了谁？每行一个
          <textarea
            value={stakeholdersText}
            onChange={(event) => setStakeholdersText(event.target.value)}
            rows={4}
            placeholder={"同学\n家长\n平台推荐系统"}
            style={textareaStyle}
          />
        </label>

        <label style={labelStyle}>
          可能的根源是什么？每行一个
          <textarea
            value={rootCausesText}
            onChange={(event) => setRootCausesText(event.target.value)}
            rows={4}
            placeholder={"不知道自己刷了多久\n缺少睡前替代活动\n平台不断推荐刺激内容"}
            style={textareaStyle}
          />
        </label>

        <div style={fieldGridStyle}>
          <label style={labelStyle}>
            谁试过解决？
            <input value={previousWho} onChange={(event) => setPreviousWho(event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            试过什么？
            <input value={previousWhat} onChange={(event) => setPreviousWhat(event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            为什么没成功？
            <input value={previousWhyFailed} onChange={(event) => setPreviousWhyFailed(event.target.value)} style={inputStyle} />
          </label>
        </div>

        <label style={labelStyle}>
          你想从哪个切入窗口开始？
          <input
            value={entryWindow}
            onChange={(event) => setEntryWindow(event.target.value)}
            placeholder="例如：做一个睡前选择提醒器"
            style={inputStyle}
          />
        </label>

        <button type="button" onClick={completeLevel4} disabled={isBusy} style={primaryButtonStyle}>
          保存问题侦探卡，进入第5关
        </button>
        {status ? <p>{status}</p> : null}
      </section>

      <aside style={cardStyle}>
        <h2>小伍侦探助手</h2>
        <p style={{ lineHeight: 1.7 }}>
          可以问：“这个问题还牵涉谁？”或“哪个切入点更小更可做？”
        </p>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={5}
          placeholder="把你拆不动的地方告诉小伍..."
          style={textareaStyle}
        />
        <button type="button" onClick={askTutor} disabled={isBusy} style={secondaryButtonStyle}>
          让小伍帮我拆
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
  border: "1px solid #d6c7a2",
  borderRadius: 24,
  padding: 24,
  background: "rgba(255, 250, 240, 0.9)",
  boxShadow: "0 20px 60px rgba(82, 61, 29, 0.12)",
} as const;

const fieldGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
} as const;

const labelStyle = {
  display: "grid",
  gap: 8,
  marginTop: 16,
  fontWeight: 800,
} as const;

const inputStyle = {
  border: "1px solid #d6c7a2",
  borderRadius: 14,
  padding: 12,
  font: "inherit",
} as const;

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d6c7a2",
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
  background: "#72552b",
  color: "#fffaf0",
  cursor: "pointer",
  fontWeight: 800,
} as const;

const secondaryButtonStyle = {
  marginTop: 12,
  border: "1px solid #72552b",
  borderRadius: 999,
  padding: "12px 18px",
  background: "transparent",
  color: "#72552b",
  cursor: "pointer",
  fontWeight: 800,
} as const;
