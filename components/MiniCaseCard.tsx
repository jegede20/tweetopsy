import type { AnalysisResult } from "@/lib/types";

export function MiniCaseCard({ report, caseNumber = "SAMPLE", eyebrow = "Example case", handle = "@casefile" }: { report: AnalysisResult; caseNumber?: string; eyebrow?: string; handle?: string }) {
  const hook = report.checks.hook.highlights[0];
  const markedText = hook ? <>{report.text.slice(0, hook.start)}<mark className="tweet-highlight-hook">{report.text.slice(hook.start, hook.end)}</mark>{report.text.slice(hook.end)}</> : report.text;
  return (
    <article className="mini-case-card">
      <div className="mini-case-top"><span className="eyebrow">{eyebrow}</span><span className="case-number">CASE {caseNumber}</span></div>
      <div className="mini-case-content">
        <div className="mini-score-block"><span className="mini-score">{report.score}</span><span className="mini-score-max">/100</span><span className="mini-verdict">{report.verdict}</span></div>
        <div className="mini-case-quote"><p>{markedText}</p><span>{handle}</span></div>
      </div>
      <div className="mini-case-bottom"><div className="pattern-tags"><span>{report.cause}</span><span>{report.structure.label}</span><span>{report.length.actual} chars</span></div><span className="micro-label">Writing score · not future reach</span></div>
    </article>
  );
}
