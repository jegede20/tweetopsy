import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CHECK_WEIGHTS, EMOTION_LEXICON, ENGAGEMENT_BASELINES, LENGTH_BANDS } from "@/lib/config";

const explanations = [
  { key: "hook", title: "Hook pattern", weight: CHECK_WEIGHTS.hook, copy: "We inspect the first line (up to roughly 12 words) for a contrarian opener, a numbered list, a question, a curiosity gap, or a story opening. A concise, recognizable opening scores better." },
  { key: "rhythm", title: "Sentence rhythm", weight: CHECK_WEIGHTS.rhythm, copy: "We split the text at lines and sentence boundaries, then consider average words per beat, the mix of short and long beats, and whether the ending is brief. A single wall of text has less pace contrast." },
  { key: "emotion", title: "Emotional triggers", weight: CHECK_WEIGHTS.emotion, copy: "An original, editable in-project vocabulary looks for curiosity, fear or loss, outrage, awe, and aspiration. Density and variety matter; this is a lightweight word match, not a reading of intent." },
  { key: "structure", title: "Structure", weight: CHECK_WEIGHTS.structure, copy: "We check for one clear list, question, contrarian take, story, how-to, or command. A legible single path scores higher than several structures competing at once." },
  { key: "length", title: "Length vs ideal", weight: CHECK_WEIGHTS.length, copy: "Character count is compared with a broad band for the detected structure. Lists and stories get a longer band; a contrarian take or command gets a shorter one. The bands are editable heuristics, not platform rules." },
];

const bandLabels: Record<string, string> = {
  contrarian: "Contrarian take",
  question: "Question",
  list: "List",
  howTo: "How-to",
  story: "Story",
  command: "Command",
  default: "Other / open thought",
};

export default function MethodPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell page-shell method-page">
        <Link href="/" className="button button-outline back-button">← Back to Tweetopsy</Link>
        <header className="page-heading method-heading"><span className="eyebrow eyebrow-rule">Method · version 1</span><h1>How the score <em>works.</em></h1><p>The rubric is deliberately inspectable. It measures writing mechanics, not whether a post will travel.</p></header>
        <section className="method-weight-list" aria-label="Five score checks">
          {explanations.map((item, index) => <article className="method-row" key={item.key}><div className="method-row-heading"><span className="method-number">0{index + 1}</span><h2>{item.title}</h2><strong>{item.weight}%</strong></div><p>{item.copy}</p><div className="method-weight-track"><span style={{ width: `${(item.weight / 30) * 100}%` }} /></div></article>)}
        </section>
        <section className="length-bands-card" aria-labelledby="length-bands-heading">
          <div><span className="eyebrow">Editable in lib/config.ts</span><h2 id="length-bands-heading">Length bands · characters</h2><p>Counted with spaces and punctuation after trimming the outer whitespace.</p></div>
          <div className="length-band-list">{Object.entries(LENGTH_BANDS).map(([key, band]) => <div key={key}><span>{bandLabels[key] ?? key}</span><strong>{band.min}–{band.max}</strong></div>)}</div>
        </section>
        <section className="formula-card"><span className="eyebrow">The arithmetic</span><h2>Five check scores × five weights.</h2><p>Each check receives a score from 0 to 10. We multiply each check by its share of the total, add the results, and round to a whole number:</p><code>(Hook ÷ 10 × 30) + (Rhythm ÷ 10 × 20) + (Emotion ÷ 10 × 20) + (Structure ÷ 10 × 15) + (Length ÷ 10 × 15)</code><div className="verdict-bands"><span><b>0–39</b> Flat</span><span><b>40–59</b> Decent</span><span><b>60–79</b> Strong</span><span><b>80–100</b> Built to travel</span></div></section>
        <details className="method-details">
          <summary>Exact scoring rules and vocabulary</summary>
          <div className="method-detail-content">
            <article><h3>Hook</h3><p>The first line is scored by word count: up to 7 words starts at 6.7; 8–12 at 6.0; 13–16 at 5.3; 17–22 at 4.4; 23 or more at 3.4. A matched contrarian or numbered-list pattern adds 2.4; another matched opener adds 2.1. A number or direct “you/your” adds 0.35. Scores are clamped to 0–10. The visible hook highlight ends at word 12.</p><p>Patterns checked: contrarian (“Most people…”, “Stop…”, “Unpopular opinion”, “Hot take”…), numbered list, question, curiosity gap (“Here’s what…”, “No one tells you…”), and story open (“I…”, “When…”, “One day…”).</p></article>
            <article><h3>Rhythm</h3><p>Let average words per beat be A and the coefficient of variation be CV. Start with 9.2 − |A − 8| × 0.42. With multiple beats, add 1.1 when CV is 0.25–1.1, subtract 0.8 when CV is below 0.25, otherwise subtract 0.35. A single beat subtracts 1.2. A closer of 8 words or fewer adds 0.7; an average above 19 words loses 0.16 per additional word. Clamp to 0–10.</p></article>
            <article><h3>Emotion</h3><p>Each distinct matched phrase adds 0.8, up to 2.7 points; each additional emotional group adds 0.7, up to 1.7. The base is 4.4 when a match exists (3.2 when none do). Match density above 0.32 subtracts 1.1; density above 0.08 adds 0.4. Scores are clamped to 0–10.</p><div className="lexicon-list">{Object.entries(EMOTION_LEXICON).map(([group, words]) => <p key={group}><strong>{group}</strong><span>{words.join(" · ")}</span></p>)}</div></article>
            <article><h3>Structure</h3><p>One detected structure scores 8.8 (a sole list gets a 0.4 clarity bonus); two competing structures score 6.8; three or more score 4.8; no detected structure scores 4.2. The score is clamped to 0–10.</p></article>
            <article><h3>Length</h3><p>Inside the band scores 9.5. Below it: 9.5 − (shortfall ÷ minimum) × 7.5. Above it: 9.5 − (excess ÷ maximum) × 7.5. Out-of-band results have a floor of 1; no words score 0.</p></article>
          </div>
        </details>
        <section className="method-notes"><h2>Engagement stays separate</h2><p>When views are available, expected interactions = views × {(ENGAGEMENT_BASELINES.viewsRate * 100).toFixed(1)}%. Otherwise, when follower count is available, expected interactions = followers × {(ENGAGEMENT_BASELINES.followerRate * 100).toFixed(0)}%. “× expected” is (likes + reposts + replies) ÷ expected interactions. It is a rough estimate and never changes the writing score.</p><p>Tweet text fetched from a link is returned by FxTwitter or text-only Twitter oEmbed. If those services fail, paste text manually. All analysis and history stay in this browser unless you explicitly request an optional AI rewrite.</p></section>
        <p className="method-bottom-line">The score measures the writing, not future reach.</p>
      </main>
      <SiteFooter />
    </>
  );
}
