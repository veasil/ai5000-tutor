"use client";

import { useRef } from "react";

export function HomePrototypeShell() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function attachBridge() {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || doc.body.dataset.mvpHomeBridgeAttached === "true") return;

    doc.body.dataset.mvpHomeBridgeAttached = "true";
    doc.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element | null;
        const link = target?.closest("a[href]") as HTMLAnchorElement | null;
        if (!link) return;

        const href = link.getAttribute("href") || "";
        if (!/^level1\.html(?:[?#].*)?$/.test(href)) return;

        event.preventDefault();
        event.stopPropagation();
        startJourney().catch((error) => {
          window.alert(error instanceof Error ? error.message : "启动 MVP 旅程失败");
        });
      },
      true
    );
  }

  async function startJourney() {
    const authResponse = await fetch("/api/auth/anonymous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ageStage: "GROWTH", playMode: "CREATOR" }),
    });
    const authResult = await authResponse.json();
    if (!authResponse.ok || !authResult.ok) {
      throw new Error(authResult.error || "匿名身份创建失败");
    }

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
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8efe0" }}>
      <iframe
        ref={iframeRef}
        src="/prototype/index.html"
        title="AI5000天完整静态首页原型"
        onLoad={attachBridge}
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
