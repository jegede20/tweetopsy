import type { AnalysisResult } from "@/lib/types";

export function ScoreCard({ report }: { report: AnalysisResult }) {
  return (
    <section className="score-card" aria-label={`Writing score ${report.score} out of 100, ${report.verdict}`}>
      <div className="score-card-top"><span className="eyebrow light-eyebrow">Writing score</span><span className="score-index">01 / 05 checks</span></div>
      <div className="score-number-row"><span className="score-number">{report.score}</span><span className="score-denominator">/100</span></div>
      <p className="score-verdict">{report.verdict}</p>
      <div className="score-progress" role="progressbar" aria-label="Writing score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={report.score}><span style={{ width: `${report.score}%` }} /></div>
      <p className="score-note">A rules-based read of the writing. Not a prediction of reach.</p>
    </section>
  );
}
