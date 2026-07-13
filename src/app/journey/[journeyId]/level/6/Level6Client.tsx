"use client";

import { useState } from "react";

type Level6ClientProps = {
  journeyId: string;
  mechanismContext: string;
};

export function Level6Client({ journeyId, mechanismContext }: Level6ClientProps) {
  const [promptTemplate, setPromptTemplate] = useState("");
  const [testPlan, setTestPlan] = useState("");
  const [modularPlan, setModularPlan] = useState("");
  const [securityRule, setSecurityRule] = useState("");
  const [ethicsReminder, setEthicsReminder] = useState("");
  const [collaborationText, setCollaborationText] = useState("");
  const [safetyText, setSafetyText] = useState("");
  const [ethicsText, setEthicsText] = useState("");
  const [question, setQuestion] = useState("");
  const [tutorReply, setTutorReply] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function askTutor() {
    if (!question.trim()) return;
    setIsBusy(true);
    setStatus("小伍正在帮你整理开工清单...");

    try {
      const response = await fetch(`/api/tutor/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 6, message: question }),
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

  async function completeLevel6() {
    setIsBusy(true);
    setStatus("正在保存 AI 共创准备清单...");

    try {
      const response = await fetch(`/api/journey/${journeyId}/level/6`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptTemplate,
          testPlan,
          modularPlan,
          securityRule,
          ethicsReminder,
          collaborationText,
          safetyText,
          ethicsText,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "第6关提交失败");
      }

      window.location.href = `/journey/${journeyId}/level/7`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "第6关提交失败");
      setIsBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 20 }}>
      <section style={cardStyle}>
        <h2>开工前先写共创清单</h2>
        <p style={{ lineHeight: 1.7 }}>
          你上一关拆出的 AI 机制是：<strong>{mechanismContext}</strong>。
          现在把它变成一个安全、可测试、可迭代的 AI 共创准备包。
        </p>

        <label style={labelStyle}>Prompt 模板<textarea value={promptTemplate} onChange={(event) => setPromptTemplate(event.target.value)} rows={3} placeholder="我想让 AI 帮我___，输入是___，输出要___。" style={textareaStyle} /></label>
        <label style={labelStyle}>测试计划<textarea value={testPlan} onChange={(event) => setTestPlan(event.target.value)} rows={3} placeholder="我会用哪些例子测试它有没有帮到人？" style={textareaStyle} /></label>
        <label style={labelStyle}>模块拆分<textarea value={modularPlan} onChange={(event) => setModularPlan(event.target.value)} rows={3} placeholder="先做输入、提醒、结果展示中的哪一块？" style={textareaStyle} /></label>
        <label style={labelStyle}>安全铁律<input value={securityRule} onChange={(event) => setSecurityRule(event.target.value)} placeholder="例如：不收集真实姓名、手机号、学校班级" style={inputStyle} /></label>
        <label style={labelStyle}>伦理提醒<input value={ethicsReminder} onChange={(event) => setEthicsReminder(event.target.value)} placeholder="例如：AI 只提醒，不替用户做决定" style={inputStyle} /></label>

        <label style={labelStyle}>协作流程清单（每行一个）<textarea value={collaborationText} onChange={(event) => setCollaborationText(event.target.value)} rows={4} placeholder={"先写需求\n让 AI 生成草案\n自己检查并修改"} style={textareaStyle} /></label>
        <label style={labelStyle}>安全项（每行一个）<textarea value={safetyText} onChange={(event) => setSafetyText(event.target.value)} rows={4} placeholder={"不输入隐私\n不上传未授权图片\n给用户退出选择"} style={textareaStyle} /></label>
        <label style={labelStyle}>伦理项（每行一个）<textarea value={ethicsText} onChange={(event) => setEthicsText(event.target.value)} rows={4} placeholder={"说明 AI 可能会错\n保留人的选择权\n避免让人沉迷"} style={textareaStyle} /></label>

        <button type="button" onClick={completeLevel6} disabled={isBusy} style={primaryButtonStyle}>
          保存共创准备包，进入第7关
        </button>
        {status ? <p>{status}</p> : null}
      </section>

      <aside style={cardStyle}>
        <h2>小伍共创教练</h2>
        <p style={{ lineHeight: 1.7 }}>
          可以问：“我的 prompt 应该怎么写？”或“这个功能有什么安全风险？”
        </p>
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={5} placeholder="把你开工前的担心告诉小伍..." style={textareaStyle} />
        <button type="button" onClick={askTutor} disabled={isBusy} style={secondaryButtonStyle}>
          让小伍帮我整理
        </button>
        {tutorReply ? <div style={{ marginTop: 16, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{tutorReply}</div> : null}
      </aside>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #b6d2c6",
  borderRadius: 24,
  padding: 24,
  background: "rgba(246, 255, 250, 0.9)",
  boxShadow: "0 20px 60px rgba(31, 86, 64, 0.12)",
} as const;

const labelStyle = {
  display: "grid",
  gap: 8,
  marginTop: 16,
  fontWeight: 800,
} as const;

const inputStyle = {
  border: "1px solid #b6d2c6",
  borderRadius: 14,
  padding: 12,
  font: "inherit",
} as const;

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #b6d2c6",
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
  background: "#2e6d52",
  color: "#f6fffa",
  cursor: "pointer",
  fontWeight: 800,
} as const;

const secondaryButtonStyle = {
  marginTop: 12,
  border: "1px solid #2e6d52",
  borderRadius: 999,
  padding: "12px 18px",
  background: "transparent",
  color: "#2e6d52",
  cursor: "pointer",
  fontWeight: 800,
} as const;
