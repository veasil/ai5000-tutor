"use client";

import { useMemo, useRef, useState } from "react";

type PrototypeLevelShellProps = {
  journeyId: string;
  level: number;
};

type PrototypeFrameValues = {
  text: string;
  url?: string;
  title?: string;
};

export function PrototypeLevelShell({ journeyId, level }: PrototypeLevelShellProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("原型已嵌入：请先在页面里体验/填写，再点右下角同步。");
  const [isBusy, setIsBusy] = useState(false);

  const prototypeUrl = useMemo(
    () => `/prototype/level${level}.html?journeyId=${encodeURIComponent(journeyId)}`,
    [journeyId, level]
  );

  async function completeLevel() {
    setIsBusy(true);
    setStatus("正在读取原型页面内容并同步到 MVP 状态机...");

    try {
      const values = collectPrototypeValues(iframeRef.current);
      const response = await fetch(`/api/journey/${journeyId}/level/${level}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(level, journeyId, values)),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || `第${level}关同步失败`);
      }

      const nextLevel = Math.min(level + 1, 10);
      setStatus(level === 10 ? "发布完成，正在刷新作品卡..." : `已同步，正在进入第${nextLevel}关...`);
      window.location.href = `/journey/${journeyId}/level/${nextLevel}`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `第${level}关同步失败`);
      setIsBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8efe0" }}>
      <iframe
        ref={iframeRef}
        src={prototypeUrl}
        title={`第${level}关完整静态原型`}
        style={{
          width: "100%",
          minHeight: "100vh",
          border: 0,
          display: "block",
          background: "#f8efe0",
        }}
      />
      <aside style={bridgeStyle}>
        <strong>Next MVP 桥接</strong>
        <span style={{ lineHeight: 1.5 }}>
          当前显示的是原始 HTML 交互原型。React 只负责同步进度和入库。
        </span>
        <button type="button" onClick={completeLevel} disabled={isBusy} style={buttonStyle}>
          {isBusy ? "同步中..." : level === 10 ? "同步并完成发布" : `同步第${level}关，进入下一关`}
        </button>
        <span style={{ color: "#6f604c", lineHeight: 1.45 }}>{status}</span>
      </aside>
    </main>
  );
}

function collectPrototypeValues(iframe: HTMLIFrameElement | null): PrototypeFrameValues {
  const fallback = {
    text: "基于原型交互完成本关记录",
  };

  try {
    const doc = iframe?.contentDocument;
    if (!doc) return fallback;

    const fields = Array.from(doc.querySelectorAll("input, textarea, select"))
      .map((node) => {
        const field = node as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (field instanceof HTMLInputElement && field.type === "checkbox") {
          return field.checked ? field.value || "已勾选" : "";
        }
        return field.value;
      })
      .map((value) => value.trim())
      .filter(Boolean);

    const activeText = Array.from(doc.querySelectorAll(".active, .selected, .done, [aria-selected='true']"))
      .map((node) => node.textContent?.trim() || "")
      .filter(Boolean);

    const text = [...fields, ...activeText].join(" / ").slice(0, 900) || fallback.text;
    const url = fields.find((value) => /^https?:\/\//i.test(value));
    const title = doc.title || undefined;

    return { text, url, title };
  } catch {
    return fallback;
  }
}

function buildPayload(level: number, journeyId: string, values: PrototypeFrameValues) {
  const text = values.text || "基于原型交互完成本关记录";
  const url = values.url || `https://example.com/ai5000-demo-${journeyId}`;

  switch (level) {
    case 2:
      return { selectedIssueIndex: 0, selectedIssue: firstLine(text, "负责任 AI 创作议题") };
    case 3:
      return {
        protagonist: firstLine(text, "目标用户"),
        plot: longText(text, "我观察到一个具体场景：用户需要一个更安全、更清楚的 AI 小工具来帮助自己做判断。"),
        evidence: firstLine(text, "来自原型填写和观察记录"),
        materialMethod: "MEMORY",
        materialContent: longText(text, "这是从原型交互中整理出的素材记录。"),
      };
    case 4:
      return {
        surfaceDescription: firstLine(text, "用户在真实场景中遇到的问题表象"),
        stakeholdersText: longText(text, "孩子，家长，老师，平台"),
        rootCausesText: longText(text, "信息不清楚，提醒不及时，缺少安全判断"),
        previousWho: "使用者",
        previousWhat: firstLine(text, "曾经尝试自己判断或向他人求助"),
        previousWhyFailed: "缺少结构化提醒和持续反馈",
        entryWindow: firstLine(text, "从一个最小提醒或判断入口切入"),
      };
    case 5:
      return {
        mechanismDescription: longText(text, "这个 AI 小作品通过收集用户输入、识别关键信号、生成提醒建议来帮助用户做更负责任的选择。"),
        aiCanDoText: "识别输入，整理线索，生成提醒，提供下一步建议",
        aiCannotDoText: "不能替代家长老师判断，不能承诺绝对正确，不能收集隐私",
        analogyDescription: firstLine(text, "像一个会提醒边界的小助手"),
      };
    case 6:
      return {
        promptTemplate: longText(text, "请根据用户描述，给出安全、清楚、可执行的一步建议。"),
        testPlan: "用三个真实但不含隐私的场景测试建议是否清楚。",
        modularPlan: "输入区，判断区，提醒区，复盘区",
        securityRule: "不收集姓名、电话、住址等隐私信息。",
        ethicsReminder: "提醒用户保留人工判断，不制造恐慌。",
        collaborationText: "先写需求，再让 AI 生成草稿，最后人工检查",
        safetyText: "隐私保护，内容边界，退出选择",
        ethicsText: "不夸大效果，不替代人类判断，尊重用户",
      };
    case 7:
      return {
        vision: firstLine(text, "帮助用户在关键时刻做出更安全的选择"),
        aiAction: "AI 负责识别风险线索并生成提醒建议",
        awareness: "让用户意识到当前选择可能带来的风险",
        behavior: "引导用户停一下、看提示、再决定",
        result: "用户能得到一条更清楚的行动建议",
        demoPlan: longText(text, "做一个包含输入、分析、提醒和复盘的最小 Demo。"),
        effectVerification: "用户能在 1 分钟内得到可执行建议",
        responsibilityDecision: "不收集隐私，不替代人工判断",
      };
    case 8:
      return {
        demoUrl: url,
        iterationChanges: longText(text, "完成 Demo 的核心输入、提醒和结果展示流程。"),
        iterationTestResult: "已用原型流程进行人工验证，核心路径可以走通。",
        responsibilityReview: "已检查隐私、安全、误导和人工确认边界。",
        engineeringCheckpoint: true,
        bodyRelaxCheckpoint: true,
      };
    case 9:
      return {
        demoUrl: url,
        realImpact: longText(text, "这个作品能帮助用户在真实场景里更清楚地识别风险并采取行动。"),
        spreadImpact: "通过课堂展示、作品卡和家长分享传播给目标用户。",
        slogan: firstLine(text, "停一下，看清楚，再选择"),
        sustainedImpact: "后续可以根据用户反馈继续迭代提醒规则。",
        stakeholderAnalysis: "孩子、家长、老师和平台都会受到影响，需要透明说明边界。",
        safetyCommitment: true,
      };
    case 10:
      return {
        title: firstLine(values.title || text, "负责任 AI 小作品"),
        problem: firstLine(text, "我看到用户在判断风险时常常缺少清楚提醒"),
        solution: "所以我做了一个能给出安全提醒和下一步建议的 AI 小作品",
        audience: "它能帮助孩子、家长和老师更清楚地讨论安全选择",
        videoUrl: url,
        responsibilityStatement: "我确认这个作品不公开隐私、不夸大效果，并保留人工判断。",
        workCardReady: true,
        allChecksPassed: true,
        parentConfirm: true,
      };
    default:
      return {};
  }
}

function firstLine(value: string, fallback: string) {
  const clean = value.split(/\r?\n|\/|。/).map((item) => item.trim()).find(Boolean);
  return (clean || fallback).slice(0, 80);
}

function longText(value: string, fallback: string) {
  const clean = value.trim();
  return clean.length >= 10 ? clean : fallback;
}

const bridgeStyle = {
  position: "fixed",
  right: 18,
  bottom: 18,
  width: "min(360px, calc(100vw - 36px))",
  display: "grid",
  gap: 10,
  padding: 16,
  border: "3px solid #2f281f",
  borderRadius: 18,
  background: "rgba(255, 250, 239, 0.96)",
  boxShadow: "8px 8px 0 rgba(47, 40, 31, 0.25)",
  zIndex: 20,
  fontFamily: "Noto Sans SC, sans-serif",
  fontSize: 14,
  color: "#2f281f",
} as const;

const buttonStyle = {
  border: "3px solid #2f281f",
  borderRadius: 999,
  padding: "12px 16px",
  background: "#f2b84b",
  color: "#2f281f",
  cursor: "pointer",
  fontWeight: 900,
} as const;
