"use client";

import { useRouter } from "next/navigation";
import { analyze } from "@/lib/analysis";
import { saveCase } from "@/lib/storage";
import pattern from "@/data/pattern-of-day.json";
import { MiniCaseCard } from "@/components/MiniCaseCard";

export function PatternOfDay() {
  const router = useRouter();
  const report = analyze(pattern.text);
  function inspect() {
    const saved = saveCase(report, pattern.sourceUrl);
    router.push(`/report?case=${encodeURIComponent(saved.id)}`);
  }
  return (
    <section className="pattern-section" aria-labelledby="pattern-heading">
      <div className="section-heading-row"><div><span className="eyebrow">A hand-curated example</span><h2 className="section-title" id="pattern-heading">{pattern.dateLabel}</h2></div><a className="text-link" href={pattern.sourceUrl} target="_blank" rel="noreferrer">Original post ↗</a></div>
      <div className="pattern-grid">
        <MiniCaseCard report={report} caseNumber={pattern.caseNumber} eyebrow="Featured autopsy" handle={pattern.handle} />
        <div className="pattern-context">
          <p className="pattern-author">{pattern.author} <span>{pattern.handle} · Aug 2017</span></p>
          <p>{pattern.context}</p>
          <button className="button button-outline" type="button" onClick={inspect}>Open this case</button>
          <p className="micro-label">Static example; no scraping or live engagement lookup.</p>
        </div>
      </div>
    </section>
  );
}
