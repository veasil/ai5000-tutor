"use client";

import { useEffect, useState } from "react";

type Level1WqtEmbedProps = {
  journeyId: string;
  wqtUrl: string;
};

type WqtCompleteMessage = {
  type?: string;
  journeyId?: string;
  wqtSessionId?: string | number;
  sessionId?: string | number;
  reviewSnapshot?: unknown;
  reportUrl?: string;
};

export function Level1WqtEmbed({ journeyId, wqtUrl }: Level1WqtEmbedProps) {
  const [status, setStatus] = useState("请在下方完成小伍风险卡牌局。");
  const [iframeSrc, setIframeSrc] = useState(wqtUrl);

  useEffect(() => {
    setIframeSrc(buildWqtUrl(wqtUrl, journeyId));
  }, [journeyId, wqtUrl]);

  useEffect(() => {
    async function handleMessage(event: MessageEvent<WqtCompleteMessage>) {
      const data = event.data;
      if (!data || !["WQT_LEVEL1_COMPLETED", "wqt:level1:completed"].includes(data.type || "")) {
        return;
      }

      const wqtSessionId = data.wqtSessionId || data.sessionId;
      if (!wqtSessionId || !data.reviewSnapshot) {
        setStatus("收到 WQT 完成消息，但缺少 session 或复盘快照。");
        return;
      }

      setStatus("已收到 WQT 复盘，正在写入 AI Tutor 旅程...");
      const response = await fetch("/api/wqt/level1/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journeyId: data.journeyId || journeyId,
          wqtSessionId,
          reviewSnapshot: data.reviewSnapshot,
          reportUrl: data.reportUrl,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        setStatus(result.error || "写入第1关结果失败，请稍后重试。");
        return;
      }

      setStatus("第1关已完成，正在进入下一关。");
      window.location.href = `/journey/${journeyId}/level/2`;
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [journeyId]);

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          border: "1px solid #d8c6a1",
          borderRadius: 16,
          padding: 16,
          background: "#fff8ec",
          color: "#3f2d1b",
        }}
      >
        <strong>第1关 · WQT 卡牌局</strong>
        <p style={{ margin: "8px 0 0" }}>{status}</p>
      </div>
      <iframe
        title="小伍风险冒险局"
        src={iframeSrc}
        style={{
          width: "100%",
          minHeight: "760px",
          border: "1px solid #d8c6a1",
          borderRadius: 20,
          background: "#fff",
        }}
      />
    </section>
  );
}

function buildWqtUrl(wqtUrl: string, journeyId: string) {
  try {
    const url = new URL(wqtUrl, window.location.href);
    url.searchParams.set("journeyId", journeyId);
    url.searchParams.set("aitutor_origin", window.location.origin);
    return url.toString();
  } catch (_) {
    return wqtUrl;
  }
}
