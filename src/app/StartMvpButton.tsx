"use client";

import { useState } from "react";

export function StartMvpButton() {
  const [status, setStatus] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  async function startJourney() {
    setIsStarting(true);
    setStatus("正在创建匿名创客身份...");

    try {
      const authResponse = await fetch("/api/auth/anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageStage: "GROWTH", playMode: "CREATOR" }),
      });
      const authResult = await authResponse.json();
      if (!authResponse.ok || !authResult.ok) {
        throw new Error(authResult.error || "匿名身份创建失败");
      }

      setStatus("正在开启十关旅程...");
      const journeyResponse = await fetch("/api/journey/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: authResult.data.childId }),
      });
      const journeyResult = await journeyResponse.json();
      if (!journeyResponse.ok || !journeyResult.ok) {
        throw new Error(journeyResult.error || "旅程创建失败");
      }

      window.location.href = `/journey/${journeyResult.data.journeyId}/level/1`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "启动失败，请稍后重试");
      setIsStarting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 10, marginTop: 28 }}>
      <button
        type="button"
        onClick={startJourney}
        disabled={isStarting}
        style={{
          width: "fit-content",
          border: "none",
          borderRadius: 999,
          padding: "14px 22px",
          background: "#2e594f",
          color: "#fffaf0",
          cursor: isStarting ? "wait" : "pointer",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {isStarting ? "正在开启..." : "开始 MVP 闯关"}
      </button>
      {status ? <p style={{ margin: 0 }}>{status}</p> : null}
    </div>
  );
}
