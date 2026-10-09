import Link from "next/link";
import { analyze } from "@/lib/analysis";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { MiniCaseCard } from "@/components/MiniCaseCard";
import { PatternOfDay } from "@/components/PatternOfDay";

const sampleText = "Most people don't need another productivity system. They need a first step small enough to start before the day gets noisy.\n\nWrite for ten minutes. Then decide what the next ten should be.";
const sampleReport = analyze(sampleText);
const checks = [
  ["01", "Hook pattern", "What the first line promises, asks, or challenges."],
  ["02", "Sentence rhythm", "The mix of short and long beats, including the closer."],
  ["03", "Emotional triggers", "Words tied to curiosity, loss, outrage, awe, or aspiration."],
  ["04", "Structure", "A question, list, story, contrarian take, how-to, or command."],
  ["05", "Length vs ideal", "A structure-specific band, not a one-size-fits-all target."],
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero-section shell">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-rule">Virality forensics</span>
            <h1>Find out <em>why</em><br className="desktop-break" /> it went viral.</h1>
            <p className="hero-subtitle">Paste a tweet link. See the hook, rhythm, and triggers behind it. Free, in your browser.</p>
            <AnalyzeForm />
            <p className="hero-disclaimer">A writing score, not a prediction of future reach.</p>
          </div>
          <div className="hero-sample-wrap">
            <p className="sample-caption"><span className="sample-dot" /> Live sample report · original example</p>
            <MiniCaseCard report={sampleReport} caseNumber="0128" eyebrow="Case file · sample" handle="@casefile" />
            <p className="sample-footnote">The scoring rules are visible. No mystery score, no scraped examples.</p>
          </div>
        </section>

        <section className="check-intro-section shell" aria-labelledby="what-check-heading">
          <div className="section-intro"><span className="eyebrow">The examination</span><h2 className="section-title" id="what-check-heading">What we check</h2><p>Five practical signals in the writing. Each gets a score and an explanation.</p></div>
          <div className="check-list">{checks.map(([number, title, copy]) => <div className="check-list-row" key={number}><span className="check-list-number">{number}</span><h3>{title}</h3><p>{copy}</p><span className="row-arrow" aria-hidden="true">↗</span></div>)}</div>
        </section>

        <section className="score-teaser-section shell">
          <div className="score-teaser-copy"><span className="eyebrow">A transparent rubric</span><h2 className="section-title">No crystal ball.<br /><em>Just the writing.</em></h2><p>Hook, rhythm, emotion, structure, and length add up to a score out of 100. Engagement stays separate. The score measures the writing, not future reach.</p><Link className="button button-outline" href="/method">See the method</Link></div>
          <div className="weight-list" aria-label="Score weights"><div><span>Hook</span><strong>30%</strong><i><span style={{ width: "100%" }} /></i></div><div><span>Rhythm</span><strong>20%</strong><i><span style={{ width: "66.7%" }} /></i></div><div><span>Emotion</span><strong>20%</strong><i><span style={{ width: "66.7%" }} /></i></div><div><span>Structure</span><strong>15%</strong><i><span style={{ width: "50%" }} /></i></div><div><span>Length</span><strong>15%</strong><i><span style={{ width: "50%" }} /></i></div></div>
        </section>

        <div className="shell"><PatternOfDay /></div>
        <section className="try-more-section shell"><div><span className="eyebrow">Keep working the draft</span><h2 className="section-title">Compare versions.<br /><em>Check your own.</em></h2></div><div className="try-more-actions"><Link className="button button-primary" href="/draft">Check a draft</Link><Link className="button button-outline" href="/compare">Compare two tweets</Link></div></section>
      </main>
      <SiteFooter />
    </>
  );
}
