import type { AnalysisResult, CheckKey, CheckResult } from "@/lib/types";

const ORDER: CheckKey[] = ["hook", "rhythm", "emotion", "structure", "length"];

function RhythmViz({ lengths }: { lengths: number[] }) {
  const values = lengths.slice(0, 12);
  const max = Math.max(...values, 1);
  return (
    <div className="rhythm-viz" aria-label={`Sentence word counts: ${values.join(", ")}`}>
      {values.length ? values.map((value, index) => <span key={`${value}-${index}`} title={`${value} words`} style={{ height: `${Math.max(14, (value / max) * 100)}%` }} />) : <span className="empty-bar" />}
    </div>
  );
}

function LengthViz({ actual, min, max }: { actual: number; min: number; max: number }) {
  const upper = 280;
  const left = Math.min(100, (min / upper) * 100);
  const width = Math.min(100 - left, ((max - min) / upper) * 100);
  const dot = Math.max(0, Math.min(100, (actual / upper) * 100));
  return (
    <div className="length-viz-wrap">
      <div className="length-viz" aria-label={`Actual ${actual} characters; ideal band ${min} to ${max}`}>
        <span className="length-ideal-band" style={{ left: `${left}%`, width: `${width}%` }} />
        <span className="length-actual-dot" style={{ left: `${dot}%` }} />
      </div>
      <div className="length-viz-labels"><span>0</span><span>Ideal {min}–{max}</span><span>280</span></div>
    </div>
  );
}

function OneCheck({ check, report }: { check: CheckResult; report: AnalysisResult }) {
  return (
    <article className={`check-card check-${check.key}${check.key === "length" ? " check-wide" : ""}`}>
      <div className="check-card-top"><span className="check-label">{check.label}</span><span className="check-score">{check.score.toFixed(1)}<small>/10</small></span></div>
      <p className="check-reason">{check.reasons[0]}</p>
      {check.key === "rhythm" && <RhythmViz lengths={report.sentenceLengths} />}
      {check.key === "structure" && <div className="structure-tags">{report.structure.detected.length ? report.structure.detected.map((name) => <span key={name}>{name}</span>) : <span>Open thought</span>}</div>}
      {check.key === "length" && <LengthViz actual={report.length.actual} min={report.length.min} max={report.length.max} />}
      {check.reasons.length > 1 && <details className="check-details"><summary>More detail</summary><p>{check.reasons.slice(1).join(" ")}</p></details>}
    </article>
  );
}

export function CheckCards({ report }: { report: AnalysisResult }) {
  return (
    <section className="checks-section" aria-labelledby="checks-heading">
      <div className="section-heading-row"><div><span className="eyebrow">Writing breakdown</span><h2 id="checks-heading" className="section-title">Five checks</h2></div><span className="micro-label">Rules-based · transparent</span></div>
      <div className="check-grid">{ORDER.map((key) => <OneCheck key={key} check={report.checks[key]} report={report} />)}</div>
    </section>
  );
}
