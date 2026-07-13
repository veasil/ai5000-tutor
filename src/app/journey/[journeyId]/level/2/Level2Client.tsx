"use client";

import { useState } from "react";

type Level2ClientProps = {
  journeyId: string;
  concerns: string[];
};

export function Level2Client({ journeyId, concerns }: Level2ClientProps) {
  const [selectedIssueIndex, setSelectedIssueIndex] = useState(0);
  const [question, setQuestion] = useState("");
  const [tutorReply, setTutorReply] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function askTutor() {
    if (!question.trim()) return;
    setIsBusy(true);
    setStatus("小伍正在想...");

    try {
      const response = await fetch(`/api/tutor/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 2, message: question }),
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

  async function completeLevel2() {
    setIsBusy(true);
    setStatus("正在锁定责任议题...");

    try {
      const response = await fetch(`/api/journey/${journeyId}/level/2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedIssueIndex,
          selectedIssue: concerns[selectedIssueIndex],
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "第2关提交失败");
      }

      window.location.href = `/journey/${journeyId}/level/3`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "第2关提交失败");
      setIsBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 20 }}>
      <section style={cardStyle}>
        <h2>从 Top 3 里锁定一个责任议题</h2>
        <p style={{ lineHeight: 1.7 }}>
          MVP 版本先用 WQT 第 1 关的复盘结果生成三个候选议题。你先选一个最想继续做的，后面我们再把五维评分 UI 做细。
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          {concerns.map((concern, index) => (
            <button
              key={concern}
              type="button"
              onClick={() => setSelectedIssueIndex(index)}
              style={{
                ...issueButtonStyle,
                borderColor: selectedIssueIndex === index ? "#2e594f" : "#d8c6a1",
                background: selectedIssueIndex === index ? "#e2f1ea" : "#fffaf0",
              }}
            >
              <span style={{ fontWeight: 800 }}>议题 {index + 1}</span>
              <span>{concern}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={completeLevel2}
          disabled={isBusy}
          style={primaryButtonStyle}
        >
          锁定这个议题，进入第3关
        </button>
        {status ? <p>{status}</p> : null}
      </section>

      <aside style={cardStyle}>
        <h2>问问小伍</h2>
        <p style={{ lineHeight: 1.7 }}>
          可以问：“哪个议题更适合做成 AI 小作品？”或者“我为什么应该选这个？”
        </p>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={5}
          placeholder="把你的犹豫告诉小伍..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 14,
            border: "1px solid #d8c6a1",
            padding: 12,
            resize: "vertical",
          }}
        />
        <button type="button" onClick={askTutor} disabled={isBusy} style={secondaryButtonStyle}>
          让小伍帮我想一想
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
  border: "1px solid #d8c6a1",
  borderRadius: 24,
  padding: 24,
  background: "rgba(255, 250, 240, 0.86)",
  boxShadow: "0 20px 60px rgba(71, 48, 22, 0.12)",
} as const;

const issueButtonStyle = {
  display: "grid",
  gap: 6,
  textAlign: "left",
  border: "2px solid",
  borderRadius: 18,
  padding: 16,
  color: "#332316",
  cursor: "pointer",
} as const;

const primaryButtonStyle = {
  marginTop: 18,
  border: "none",
  borderRadius: 999,
  padding: "14px 22px",
  background: "#2e594f",
  color: "#fffaf0",
  cursor: "pointer",
  fontWeight: 800,
} as const;

const secondaryButtonStyle = {
  marginTop: 12,
  border: "1px solid #2e594f",
  borderRadius: 999,
  padding: "12px 18px",
  background: "transparent",
  color: "#2e594f",
  cursor: "pointer",
  fontWeight: 800,
} as const;
