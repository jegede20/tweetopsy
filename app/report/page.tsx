"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScoreCard } from "@/components/ScoreCard";
import { AnnotatedTweet } from "@/components/AnnotatedTweet";
import { CheckCards } from "@/components/CheckCards";
import { RewritePanel } from "@/components/RewritePanel";
import { ShareCard } from "@/components/ShareCard";
import { getCase } from "@/lib/storage";
import { copySummary, formatDate } from "@/lib/format";
import type { SavedCase } from "@/lib/types";

export default function ReportPage() {
  const router = useRouter();
  const [item, setItem] = useState<SavedCase | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const caseId = new URLSearchParams(window.location.search).get("case");
    setItem(getCase(caseId));
    setLoading(false);
  }, []);

  async function copy() {
    if (!item) return;
    try {
      await navigator.clipboard.writeText(copySummary(item, item.caseNumber));
      setCopyFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
      setCopyFailed(true);
      window.setTimeout(() => setCopyFailed(false), 2800);
    }
  }

  if (loading) return <><SiteHeader /><main className="shell page-shell"><div className="loading-state"><span className="button-spinner" /> Opening case file…</div></main><SiteFooter /></>;
  if (!item) return <><SiteHeader /><main className="shell page-shell"><div className="empty-state"><span className="empty-state-number">404</span><h1>Case file not found.</h1><p>This device may not have the case in local history. Tweetopsy does not create public report links.</p><div className="empty-actions"><Link className="button button-primary" href="/">Start a new autopsy</Link><Link className="button button-outline" href="/history">Open history</Link></div></div></main><SiteFooter /></>;

  return (
    <>
      <SiteHeader />
      <main className="shell page-shell report-page">
        <div className="report-topline"><button className="button button-outline back-button" type="button" onClick={() => router.back()}>← Back</button><div className="case-meta"><span className="case-number">CASE NO. {item.caseNumber}</span><span>{formatDate(item.createdAt)}</span>{item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer">Original post ↗</a>}</div></div>
        <div className="report-grid">
          <div className="report-primary-column">
            <AnnotatedTweet report={item} />
            <div className="report-desktop-actions">
              <Link className="button button-primary" href={`/share?case=${encodeURIComponent(item.id)}`}>Share card</Link>
              <button className="button button-outline" type="button" onClick={copy}>{copied ? "Copied" : "Copy summary"}</button>
              <span className="copy-status" role="status" aria-live="polite">{copyFailed ? "Clipboard unavailable." : ""}</span>
            </div>
            <RewritePanel report={item} />
            <section className="share-section"><div className="section-heading-row"><div><span className="eyebrow">Take the evidence with you</span><h2 className="section-title">Share card</h2></div><Link className="text-link" href={`/share?case=${encodeURIComponent(item.id)}`}>Open full view ↗</Link></div><ShareCard report={item} caseNumber={item.caseNumber} /></section>
          </div>
          <aside className="report-results-column">
            <ScoreCard report={item} />
            <CheckCards report={item} />
          </aside>
        </div>
        <div className="report-bottom-note"><span>Tweetopsy</span><p>The score measures the writing, not future reach.</p></div>
      </main>
      <div className="mobile-action-bar" role="region" aria-label="Report actions"><Link className="button button-primary" href={`/share?case=${encodeURIComponent(item.id)}`}>Share card</Link><button className="button button-outline" type="button" onClick={copy}>{copied ? "Copied" : copyFailed ? "Unavailable" : "Copy summary"}</button></div>
      <SiteFooter />
    </>
  );
}
