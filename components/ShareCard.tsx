"use client";

import { useRef, useState } from "react";
import type { AnalysisResult, SavedCase } from "@/lib/types";
import { copySummary } from "@/lib/format";
import { LogoMark } from "@/components/Logo";

export function ShareCard({ report, caseNumber, handle }: { report: AnalysisResult | SavedCase; caseNumber: string; handle?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const author = handle ?? report.stats?.handle ?? "@Tweetopsy";

  async function downloadPng() {
    if (!cardRef.current) return;
    setMessage("Preparing PNG…");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#F3EFE6" });
      const anchor = document.createElement("a");
      anchor.download = `tweetopsy-case-${caseNumber}.png`;
      anchor.href = dataUrl;
      anchor.click();
      setMessage("PNG downloaded.");
    } catch {
      setMessage("PNG export failed. Try again or copy the case details.");
    }
  }

  async function copyCard() {
    const text = copySummary(report, caseNumber);
    try {
      if (cardRef.current && "ClipboardItem" in window && navigator.clipboard?.write) {
        const { toBlob } = await import("html-to-image");
        const blob = await toBlob(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#F3EFE6" });
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          setMessage("Card image copied.");
          return;
        }
      }
      await navigator.clipboard.writeText(text);
      setMessage("Case details copied.");
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setMessage("Case details copied.");
      } catch {
        setMessage("Clipboard is unavailable in this browser.");
      }
    }
  }

  return (
    <div className="share-widget">
      <div className="share-card-shell">
        <div ref={cardRef} className="toe-tag" aria-label={`Tweetopsy case number ${caseNumber}, cause of virality ${report.cause}, score ${report.score}`}>
          <div className="tag-hole" />
          <p className="tag-case-no">CASE NO. {caseNumber}</p>
          <div className="tag-cause-block"><span className="eyebrow">Cause of virality</span><h3>{report.cause}</h3></div>
          <div className="tag-score-row"><span className="tag-score">{report.score}</span><span className="tag-out-of">/100<br /><small>{report.verdict}</small></span></div>
          <div className="tag-progress"><span style={{ width: `${report.score}%` }} /></div>
          <div className="tag-brand-row"><span className="tag-brand"><LogoMark size={25} /><strong>Tweetopsy</strong></span><span className="tag-handle">{author}</span></div>
        </div>
      </div>
      <div className="share-actions">
        <button type="button" className="button button-primary" onClick={downloadPng}>Download PNG</button>
        <button type="button" className="button button-outline" onClick={copyCard}>Copy card</button>
      </div>
      <p className="share-feedback" role="status" aria-live="polite">{message || "No public report link is created. Share the PNG or copied details."}</p>
    </div>
  );
}
