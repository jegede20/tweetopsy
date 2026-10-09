"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScoreCard } from "@/components/ScoreCard";
import { CheckCards } from "@/components/CheckCards";
import { RewritePanel } from "@/components/RewritePanel";
import { analyze } from "@/lib/analysis";
import { fetchTweet } from "@/lib/client-api";
import { isTweetUrl } from "@/lib/format";
import { saveCase } from "@/lib/storage";
import type { SavedCase } from "@/lib/types";

export default function DraftPage() {
  const [mode, setMode] = useState<"link" | "draft">("draft");
  const [link, setLink] = useState("");
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<SavedCase | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const characterCount = Array.from(draft).length;

  function changeMode(next: "link" | "draft") {
    setMode(next);
    setError("");
    setResult(null);
  }

  async function check() {
    setError("");
    setResult(null);
    if (mode === "draft") {
      if (!draft.trim()) { setError("Paste a draft before checking it."); return; }
      if (characterCount > 280) { setError("This draft is over 280 characters. Trim it before checking."); return; }
      const saved = saveCase(analyze(draft.trim()));
      setResult(saved);
      return;
    }
    if (!isTweetUrl(link)) { setError("Use a valid x.com or twitter.com status URL."); return; }
    setBusy(true);
    try {
      const tweet = await fetchTweet(link);
      setResult(saveCase(analyze(tweet.text, tweet.stats), link));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tweet unavailable. Switch to My draft and paste the text manually.");
    } finally { setBusy(false); }
  }

  return (
    <>
      <SiteHeader />
      <main className="shell page-shell draft-page">
        <Link href="/" className="button button-outline back-button">← Back to Tweetopsy</Link>
        <header className="page-heading"><span className="eyebrow eyebrow-rule">The writing room</span><h1>Check a <em>draft.</em></h1><p>Run the same transparent checks before you post. The analysis happens in this browser.</p></header>
        <section className="draft-input-panel paper-card">
          <div className="segmented-toggle" role="tablist" aria-label="Choose input type">
            <button type="button" role="tab" aria-selected={mode === "link"} className={mode === "link" ? "active" : ""} onClick={() => changeMode("link")}>Tweet link</button>
            <button type="button" role="tab" aria-selected={mode === "draft"} className={mode === "draft" ? "active" : ""} onClick={() => changeMode("draft")}>My draft</button>
          </div>
          {mode === "draft" ? <div className="draft-entry"><label className="eyebrow" htmlFor="draft-text">Your unposted tweet</label><textarea id="draft-text" className="text-area draft-textarea" maxLength={280} rows={7} value={draft} onChange={(event) => { setDraft(event.target.value); setResult(null); }} placeholder="Write or paste a draft…" /><div className="draft-form-meta"><span className={characterCount > 260 ? "character-count near-limit" : "character-count"}>{characterCount} / 280 characters</span><span className="micro-label">Live count · drafts over 280 need trimming</span></div></div> : <div className="draft-entry"><label className="eyebrow" htmlFor="draft-link">Public X / Twitter status link</label><input id="draft-link" className="pill-input draft-link-input" value={link} onChange={(event) => { setLink(event.target.value); setResult(null); }} placeholder="https://x.com/handle/status/…" /></div>}
          <p className="draft-privacy">{mode === "draft" ? "Your draft is not sent to a server for scoring. It is sent to Groq only if you explicitly request an AI rewrite below." : "If fetching fails, switch to My draft and paste the tweet text manually."}</p>
          {error && <p className="form-message message-error" role="alert">{error}</p>}
          <button className="button button-primary" type="button" onClick={check} disabled={busy}>{busy ? <><span className="button-spinner" /> Fetching…</> : mode === "draft" ? "Check draft" : "Fetch and analyze"}</button>
        </section>
        {result && <section className="draft-result" aria-label="Draft analysis">
          <div className="draft-result-top"><div><span className="eyebrow">Case no. {result.caseNumber}</span><h2 className="section-title">Draft breakdown</h2></div><Link href={`/report?case=${encodeURIComponent(result.id)}`} className="button button-outline">Open full case</Link></div>
          <div className="draft-result-grid"><div><ScoreCard report={result} /><RewritePanel report={result} draft={mode === "draft"} /></div><CheckCards report={result} /></div>
        </section>}
      </main>
      <SiteFooter />
    </>
  );
}
