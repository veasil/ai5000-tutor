"use client";

import { useState } from "react";

type Level3ClientProps = {
  journeyId: string;
  selectedIssue: string;
};

type MaterialMethod = "MEMORY" | "PEER" | "COMMUNITY" | "INTERNET";

const METHOD_OPTIONS: Array<{ value: MaterialMethod; label: string; hint: string }> = [
  { value: "MEMORY", label: "我的记忆", hint: "我亲眼见过或亲身经历过的事" },
  { value: "PEER", label: "同伴访谈", hint: "朋友、同学、家人的一句话" },
  { value: "COMMUNITY", label: "社区观察", hint: "小区、学校、线上社群里的现象" },
  { value: "INTERNET", label: "网络资料", hint: "新闻、评论、公开数据里的线索" },
];

export function Level3Client({ journeyId, selectedIssue }: Level3ClientProps) {
  const [protagonist, setProtagonist] = useState("");
  const [plot, setPlot] = useState("");
  const [evidence, setEvidence] = useState("");
  const [materialMethod, setMaterialMethod] = useState<MaterialMethod>("MEMORY");
  const [materialContent, setMaterialContent] = useState("");
  const [question, setQuestion] = useState("");
  const [tutorReply, setTutorReply] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function askTutor() {
    if (!question.trim()) return;
    setIsBusy(true);
    setStatus("小伍正在帮你找真实细节...");

    try {
      const response = await fetch(`/api/tutor/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 3, message: question }),
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

  async function completeLevel3() {
    setIsBusy(true);
    setStatus("正在保存实感故事卡...");

    try {
      const response = await fetch(`/api/journey/${journeyId}/level/3`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protagonist,
          plot,
          evidence,
          materialMethod,
          materialContent,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "第3关提交失败");
      }

      window.location.href = `/journey/${journeyId}/level/4`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "第3关提交失败");
      setIsBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 20 }}>
      <section style={cardStyle}>
        <h2>把议题落到一个真实故事里</h2>
        <p style={{ lineHeight: 1.7 }}>
          你锁定的责任议题是 <strong>「{selectedIssue}」</strong>。现在先不用写大作文，
          只要抓住一个真实的人、一件事、一条证据。
        </p>

        <label style={labelStyle}>
          主角是谁？
          <input
            value={protagonist}
            onChange={(event) => setProtagonist(event.target.value)}
            placeholder="例如：一个总被短视频推着熬夜的同学"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          发生了什么？至少写 10 个字
          <textarea
            value={plot}
            onChange={(event) => setPlot(event.target.value)}
            rows={4}
            placeholder="写一个具体场景：什么时候、在哪里、TA 遇到了什么..."
            style={textareaStyle}
          />
        </label>

        <label style={labelStyle}>
          你有什么证据？
          <input
            value={evidence}
            onChange={(event) => setEvidence(event.target.value)}
            placeholder="例如：聊天记录、一次观察、同伴的一句话、公开资料"
            style={inputStyle}
          />
        </label>

        <div style={labelStyle}>
          素材从哪里来？
          <div style={{ display: "grid", gap: 10 }}>
            {METHOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMaterialMethod(option.value)}
                style={{
                  ...methodButtonStyle,
                  borderColor: materialMethod === option.value ? "#315e7c" : "#d8c6a1",
                  background: materialMethod === option.value ? "#e2f0f8" : "#fffaf0",
                }}
              >
                <strong>{option.label}</strong>
                <span>{option.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <label style={labelStyle}>
          素材原文或观察记录
          <textarea
            value={materialContent}
            onChange={(event) => setMaterialContent(event.target.value)}
            rows={4}
            placeholder="把你看到、听到、查到的原始线索写下来..."
            style={textareaStyle}
          />
        </label>

        <button type="button" onClick={completeLevel3} disabled={isBusy} style={primaryButtonStyle}>
          保存实感故事卡，进入第4关
        </button>
        {status ? <p>{status}</p> : null}
      </section>

      <aside style={cardStyle}>
        <h2>小伍追问</h2>
        <p style={{ lineHeight: 1.7 }}>
          卡住时可以问：“这个故事还缺什么证据？”或“我该采访谁？”
        </p>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={5}
          placeholder="把你想不清楚的地方告诉小伍..."
          style={textareaStyle}
        />
        <button type="button" onClick={askTutor} disabled={isBusy} style={secondaryButtonStyle}>
          让小伍追问我
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
  border: "1px solid #c7d3d8",
  borderRadius: 24,
  padding: 24,
  background: "rgba(255, 250, 240, 0.9)",
  boxShadow: "0 20px 60px rgba(29, 64, 82, 0.12)",
} as const;

const labelStyle = {
  display: "grid",
  gap: 8,
  marginTop: 16,
  fontWeight: 800,
} as const;

const inputStyle = {
  border: "1px solid #c7d3d8",
  borderRadius: 14,
  padding: 12,
  font: "inherit",
} as const;

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #c7d3d8",
  borderRadius: 14,
  padding: 12,
  font: "inherit",
  resize: "vertical",
} as const;

const methodButtonStyle = {
  display: "grid",
  gap: 4,
  textAlign: "left",
  border: "2px solid",
  borderRadius: 16,
  padding: 14,
  color: "#332316",
  cursor: "pointer",
} as const;

const primaryButtonStyle = {
  marginTop: 20,
  border: "none",
  borderRadius: 999,
  padding: "14px 22px",
  background: "#315e7c",
  color: "#fffaf0",
  cursor: "pointer",
  fontWeight: 800,
} as const;

const secondaryButtonStyle = {
  marginTop: 12,
  border: "1px solid #315e7c",
  borderRadius: 999,
  padding: "12px 18px",
  background: "transparent",
  color: "#315e7c",
  cursor: "pointer",
  fontWeight: 800,
} as const;
