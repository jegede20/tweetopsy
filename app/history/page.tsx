"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { clearHistory, loadHistory } from "@/lib/storage";
import { formatDate } from "@/lib/format";
import type { SavedCase } from "@/lib/types";

export default function HistoryPage() {
  const [cases, setCases] = useState<SavedCase[]>([]);
  useEffect(() => setCases(loadHistory()), []);
  function onClear() {
    if (!window.confirm("Clear all Tweetopsy cases saved on this device?")) return;
    clearHistory();
    setCases([]);
  }
  return (
    <>
      <SiteHeader />
      <main className="shell page-shell history-page">
        <Link href="/" className="button button-outline back-button">← Back to Tweetopsy</Link>
        <header className="page-heading"><span className="eyebrow eyebrow-rule">Case archive</span><h1>Your history.</h1><p>Saved on this device only. Up to 50 recent cases; no account or server-side storage.</p></header>
        <div className="history-toolbar"><span className="micro-label">{cases.length} {cases.length === 1 ? "case" : "cases"} · local only</span>{cases.length > 0 && <button className="button button-outline button-danger-outline" type="button" onClick={onClear}>Clear history</button>}</div>
        {cases.length ? <div className="history-list">{cases.map((item) => <Link className="history-row" href={`/report?case=${encodeURIComponent(item.id)}`} key={item.id}>
          <span className="history-case-number">CASE {item.caseNumber}</span>
          <span className="history-excerpt"><strong>{item.text.split(/\n/)[0]?.slice(0, 110) || "Empty case"}</strong><small>{formatDate(item.createdAt)}{item.stats?.handle ? ` · ${item.stats.handle}` : " · Manual text"}</small></span>
          <span className="history-score"><b>{item.score}</b><small>/100</small></span>
          <span className="history-arrow" aria-hidden="true">↗</span>
        </Link>)}</div> : <div className="empty-state"><span className="empty-state-number">00</span><h2>No cases yet.</h2><p>Run an autopsy or check a draft. Your cases will appear here and stay on this device.</p><Link className="button button-primary" href="/">Start an autopsy</Link></div>}
      </main>
      <SiteFooter />
    </>
  );
}
