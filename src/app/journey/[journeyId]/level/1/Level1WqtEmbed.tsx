"use client";

import { useEffect, useMemo, useRef } from "react";

type Level1WqtEmbedProps = {
  journeyId: string;
  wqtUrl: string;
};

type WqtCompleteMessage = {
  type?: string;
  journeyId?: string;
  wqtSessionId?: string | number;
  sessionId?: string | number;
  reviewSnapshot?: {
    session?: { finalScore?: number };
    cards?: unknown[];
    durationMs?: number | null;
  };
  reportUrl?: string;
};

export function Level1WqtEmbed({ journeyId, wqtUrl }: Level1WqtEmbedProps) {
  const prototypeRef = useRef<HTMLIFrameElement>(null);
  const completionRef = useRef<WqtCompleteMessage | null>(null);
  const prototypeUrl = useMemo(
    () => `/prototype/level1.html?journeyId=${encodeURIComponent(journeyId)}`,
    [journeyId]
  );

  useEffect(() => {
    const iframe = prototypeRef.current;
    if (!iframe) return;
    const retryId = window.setInterval(() => {
      if (attachPrototypeBridge()) window.clearInterval(retryId);
    }, 250);
    const handleLoad = () => {
      if (attachPrototypeBridge()) window.clearInterval(retryId);
    };
    iframe.addEventListener("load", handleLoad);
    attachPrototypeBridge();
    return () => {
      window.clearInterval(retryId);
      iframe.removeEventListener("load", handleLoad);
    };
  }, [journeyId, wqtUrl]);

  function attachPrototypeBridge() {
    const prototypeFrame = prototypeRef.current;
    const doc = prototypeFrame?.contentDocument;
    const prototypeWindow = prototypeFrame?.contentWindow;
    if (!doc || !prototypeWindow || !doc.body) return false;
    if (doc.body.dataset.wqtBridgeAttached === "true") return true;

    const cardPlaceholder = doc.querySelector<HTMLElement>("#sec3 .placeholder-zone");
    const cardNextButton = doc.getElementById("cardNextBtn") as HTMLButtonElement | null;
    if (!cardPlaceholder || !cardNextButton) {
      return false;
    }
    doc.body.dataset.wqtBridgeAttached = "true";

    const wqtFrame = doc.createElement("iframe");
    wqtFrame.title = "AI5000天伍力全开卡牌系统";
    wqtFrame.src = buildWqtUrl(wqtUrl, journeyId, prototypeWindow.location.origin);
    wqtFrame.allow = "clipboard-write";
    wqtFrame.referrerPolicy = "strict-origin-when-cross-origin";
    Object.assign(wqtFrame.style, {
      display: "block",
      width: "100%",
      height: "min(74vh, 760px)",
      minHeight: "580px",
      border: "0",
      background: "#07132f",
    });

    cardPlaceholder.replaceChildren(wqtFrame);
    Object.assign(cardPlaceholder.style, {
      display: "block",
      padding: "0",
      overflow: "hidden",
      borderStyle: "solid",
      borderColor: "var(--ink)",
      background: "#07132f",
    });
    cardNextButton.disabled = true;
    cardNextButton.textContent = "完成 WQT 复盘后继续 →";
    cardNextButton.style.opacity = "0.55";

    const handleWqtMessage = (event: MessageEvent<WqtCompleteMessage>) => {
      if (event.origin !== safeOrigin(wqtUrl)) return;
      const data = event.data;
      if (!data || !["WQT_LEVEL1_COMPLETED", "wqt:level1:completed"].includes(data.type || "")) {
        return;
      }
      if (data.journeyId && data.journeyId !== journeyId) return;
      if (!(data.wqtSessionId || data.sessionId) || !data.reviewSnapshot) return;

      completionRef.current = data;
      renderReviewSummary(doc, data);
      cardNextButton.disabled = false;
      cardNextButton.textContent = "复盘已同步，继续 →";
      cardNextButton.style.opacity = "1";
      cardNextButton.click();
    };

    prototypeWindow.addEventListener("message", handleWqtMessage);

    doc.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element | null;
        const link = target?.closest("a[href]") as HTMLAnchorElement | null;
        if (!link || !/^level2\.html(?:[?#].*)?$/.test(link.getAttribute("href") || "")) return;

        event.preventDefault();
        event.stopPropagation();
        completeLevel(doc).catch((error) => {
          window.alert(error instanceof Error ? error.message : "第1关保存失败");
        });
      },
      true
    );
    return true;
  }

  async function completeLevel(doc: Document) {
    const completion = completionRef.current;
    const wqtSessionId = completion?.wqtSessionId || completion?.sessionId;
    if (!completion?.reviewSnapshot || !wqtSessionId) {
      throw new Error("请先在卡牌系统中完成对局并生成复盘。");
    }

    const response = await fetch("/api/wqt/level1/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        journeyId,
        wqtSessionId,
        reviewSnapshot: completion.reviewSnapshot,
        reportUrl: completion.reportUrl,
        entryChoice: doc.querySelector(".path-btn.selected")?.getAttribute("data-path") === "idea"
          ? "IDEA"
          : "RECOMMEND",
        ideaText: valueOf(doc, "ideaInput") || undefined,
        powerScores: {
          bodySafety: sliderValue(doc, "physical"),
          mentalSafety: sliderValue(doc, "psychological"),
          socialSafety: sliderValue(doc, "social"),
          economicSafety: sliderValue(doc, "economic"),
          digitalRights: sliderValue(doc, "digital"),
        },
        top3Concerns: Array.from(doc.querySelectorAll<HTMLElement>(".ichip.selected"))
          .map((chip) => chip.dataset.issue || chip.textContent || "")
          .map((value) => value.trim())
          .filter(Boolean)
          .slice(0, 3),
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "写入第1关结果失败，请稍后重试。");
    }
    window.location.href = `/journey/${journeyId}/level/2`;
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8efe0" }}>
      <iframe
        ref={prototypeRef}
        src={prototypeUrl}
        title="第1关完整静态原型"
        style={{
          width: "100%",
          minHeight: "100vh",
          border: 0,
          display: "block",
          background: "#f8efe0",
        }}
      />
    </main>
  );
}

function buildWqtUrl(wqtUrl: string, journeyId: string, tutorOrigin: string) {
  const url = new URL(wqtUrl);
  url.searchParams.set("embed", "1");
  url.searchParams.set("journeyId", journeyId);
  url.searchParams.set("aitutor_origin", tutorOrigin);
  return url.toString();
}

function safeOrigin(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

function renderReviewSummary(doc: Document, data: WqtCompleteMessage) {
  const placeholder = doc.querySelector<HTMLElement>("#sec4 .placeholder-zone");
  if (!placeholder) return;
  const cards = data.reviewSnapshot?.cards?.length || 0;
  const score = data.reviewSnapshot?.session?.finalScore;
  const minutes = data.reviewSnapshot?.durationMs
    ? Math.max(1, Math.round(data.reviewSnapshot.durationMs / 60000))
    : null;

  placeholder.innerHTML = "";
  const title = doc.createElement("strong");
  title.textContent = "📊 WQT 真实复盘已同步";
  title.style.fontSize = "20px";
  const summary = doc.createElement("span");
  summary.textContent = `${cards} 张卡牌 · ${score == null ? "已完成计分" : `${Math.round(score)} 分`}${minutes ? ` · ${minutes} 分钟` : ""}`;
  summary.style.fontFamily = "var(--fun)";
  summary.style.color = "var(--ink-soft)";
  placeholder.append(title, summary);

  if (data.reportUrl) {
    const report = doc.createElement("a");
    report.href = data.reportUrl;
    report.target = "_blank";
    report.rel = "noopener";
    report.textContent = "打开完整复盘报告 ↗";
    report.className = "btn btn-soft";
    placeholder.append(report);
  }
}

function valueOf(doc: Document, id: string) {
  return (doc.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null)?.value.trim() || "";
}

function sliderValue(doc: Document, dimension: string) {
  const input = doc.querySelector<HTMLInputElement>(`.sa-slider[data-dim="${dimension}"]`);
  return Math.min(5, Math.max(1, Number(input?.value) || 1));
}
