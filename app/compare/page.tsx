"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { analyze } from "@/lib/analysis";
import { fetchTweet } from "@/lib/client-api";
import { isTweetUrl, isUrlLike } from "@/lib/format";
import type { AnalysisResult, CheckKey } from "@/lib/types";

const checks: Array<{ key: CheckKey; label: string }> = [
  { key: "hook", label: "Hook" }, { key: "rhythm", label: "Rhythm" }, { key: "emotion", label: "Emotion" }, { key: "structure", label: "Structure" }, { key: "length", label: "Length" },
];

async function resolveInput(value: string): Promise<AnalysisResult> {
  const input = value.trim();
  if (!input) throw new Error("Add a tweet link or text to both sides.");
  if (isUrlLike(input)) {
    if (!isTweetUrl(input)) throw new Error("Use a valid x.com or twitter.com status link, or paste the tweet text.");
    const tweet = await fetchTweet(input);
    return analyze(tweet.text, tweet.stats);
  }
  return analyze(input);
}

export default function ComparePage() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [results, setResults] = useState<[AnalysisResult, AnalysisResult] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function compare() {
    setError("");
    setResults(null);
    setBusy(true);
    try {
      const [a, b] = await Promise.all([resolveInput(left), resolveInput(right)]);
      setResults([a, b]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "One side could not be analyzed. Check the input and try again.");
    } finally { setBusy(false); }
  }

  const scoreGap = results ? results[0].score - results[1].score : 0;
  const winner = scoreGap === 0 ? "tie" : scoreGap > 0 ? "A" : "B";
  const biggestGap = results ? checks.map((check) => ({ ...check, diff: results[0].checks[check.key].score - results[1].checks[check.key].score })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0] : null;
  const difference = !biggestGap || biggestGap.diff === 0 ? "The two versions score evenly across the five checks." : `Version ${biggestGap.diff > 0 ? "A" : "B"} leads on ${biggestGap.label.toLowerCase()} by ${Math.abs(biggestGap.diff).toFixed(1)} points. That is the largest difference in the writing mechanics.`;

  return (
    <>
      <SiteHeader />
      <main className="shell page-shell compare-page">
        <Link href="/" className="button button-outline back-button">← Back to Tweetopsy</Link>
        <header className="page-heading"><span className="eyebrow eyebrow-rule">Side-by-side examination</span><h1>Which version <em>works harder?</em></h1><p>Compare writing mechanics, not predicted reach. Paste a public link or tweet text in each field.</p></header>
        <div className="compare-input-grid">
          <label className="compare-input-card"><span className="compare-label"><b>A</b><span>First version</span></span><textarea className="text-area" rows={6} value={left} onChange={(event) => setLeft(event.target.value)} placeholder="Paste a tweet link or text…" /></label>
          <label className="compare-input-card"><span className="compare-label"><b>B</b><span>Second version</span></span><textarea className="text-area" rows={6} value={right} onChange={(event) => setRight(event.target.value)} placeholder="Paste a tweet link or text…" /></label>
        </div>
        {error && <p className="form-message message-error" role="alert">{error}</p>}
        <button className="button button-primary compare-button" type="button" onClick={compare} disabled={busy}>{busy ? <><span className="button-spinner" /> Comparing…</> : "Compare both"}</button>
        {results && <section className="compare-results" aria-labelledby="compare-results-title">
          <div className="compare-winner-head"><div><span className="eyebrow">Results · same rules on both</span><h2 className="section-title" id="compare-results-title">{winner === "tie" ? "A close read." : `Version ${winner} comes out ahead.`}</h2><p>{difference}</p></div><span className={`winner-badge${winner === "tie" ? " winner-tie" : ""}`}>{winner === "tie" ? "Tied" : `Winner ${winner}`}</span></div>
          <div className="compare-score-grid">{results.map((report, index) => <article className={`compare-score-card${winner === (index === 0 ? "A" : "B") ? " winner-card" : ""}`} key={index}><div className="compare-card-top"><span className="eyebrow">Version {index === 0 ? "A" : "B"}</span>{winner === (index === 0 ? "A" : "B") && <span className="strength-flag">Winner</span>}</div><div className="compare-big-score">{report.score}<small>/100</small></div><p>{report.verdict} · {report.cause}</p></article>)}</div>
          <div className="paired-bars-card"><div className="paired-bars-heading"><h3>Check by check</h3><div className="bar-legend"><span><i className="legend-a" /> A</span><span><i className="legend-b" /> B</span></div></div>{checks.map(({ key, label }) => <div className="paired-check-row" key={key}><span className="paired-check-label">{label}</span><div className="paired-bars"><div className="paired-bar-line"><span className="paired-value">{results[0].checks[key].score.toFixed(1)}</span><span className="paired-track"><i className="paired-fill fill-a" style={{ width: `${results[0].checks[key].score * 10}%` }} /></span></div><div className="paired-bar-line"><span className="paired-value">{results[1].checks[key].score.toFixed(1)}</span><span className="paired-track"><i className="paired-fill fill-b" style={{ width: `${results[1].checks[key].score * 10}%` }} /></span></div></div></div>)}</div>
          <p className="quiet-note">The score measures the writing, not future reach. Engagement numbers do not decide the winner.</p>
        </section>}
      </main>
      <SiteFooter />
    </>
  );
}
