"use client";

import { useState } from "react";
import type { AnalysisResult, RewriteResult } from "@/lib/types";
import { requestRewrite } from "@/lib/client-api";

export function RewritePanel({ report, draft = false }: { report: AnalysisResult; draft?: boolean }) {
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getRewrite() {
    setError("");
    setLoading(true);
    try {
      const weaknesses = report.suggestions.map((item) => `${item.label}: ${item.advice}`);
      const response = await requestRewrite(report.text, weaknesses);
      setResult(response);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI rewrite unavailable. The rules-based report is still ready.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="paper-card rewrite-panel" aria-labelledby="rewrite-heading">
      <div className="section-heading-row"><div><span className="eyebrow">Optional AI edit</span><h2 id="rewrite-heading" className="section-title">Ways to strengthen it</h2></div><span className="ai-optional-label">On request only</span></div>
      {report.suggestions.length ? (
        <ul className="fix-list">
          {report.suggestions.map((suggestion) => <li key={suggestion.check}><span className="fix-label">{suggestion.label}</span><span>{suggestion.advice}</span></li>)}
        </ul>
      ) : <p className="quiet-note">No obvious rules-based weakness to flag. Keep the original meaning and voice.</p>}
      <div className="ai-consent-note">{draft ? "Your draft stays in this browser unless you request an AI rewrite. Only then is the text and these detected weaknesses sent to Groq." : "The rules-based report is local. Your tweet text is sent to Groq only if you request an AI rewrite."}</div>
      <button className="button button-outline rewrite-button" type="button" onClick={getRewrite} disabled={loading}>
        {loading ? <><span className="button-spinner" aria-hidden="true" /> Thinking…</> : result ? "Generate another edit" : "Request AI rewrite"}
      </button>
      {error && <p className="quiet-note rewrite-error" role="status">{error}</p>}
      {result && <div className="rewrite-result">
        <p className="rewrite-summary">{result.summary}</p>
        {result.rewrites.map((rewrite, index) => <article className="before-after" key={`${index}-${rewrite.before}`}>
          <div><span className="micro-label">Before</span><p>{rewrite.before}</p></div>
          <div className="after-text"><span className="micro-label">After</span><p>{rewrite.after}</p></div>
          <p className="rewrite-reason">{rewrite.reason}</p>
        </article>)}
      </div>}
    </section>
  );
}
