import type { AnalysisResult, HighlightRange } from "@/lib/types";
import { compactNumber } from "@/lib/format";

function paintTweet(text: string, ranges: HighlightRange[]) {
  const valid = ranges.filter((range) => range.start >= 0 && range.end <= text.length && range.end > range.start);
  const boundaries = new Set<number>([0, text.length]);
  for (const range of valid) { boundaries.add(range.start); boundaries.add(range.end); }
  const points = [...boundaries].sort((a, b) => a - b);
  return points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    const active = valid.filter((range) => range.start < end && range.end > start);
    const kinds = new Set(active.map((range) => range.kind));
    const className = [kinds.has("hook") ? "tweet-highlight-hook" : "", kinds.has("emotion") ? "tweet-highlight-emotion" : ""].filter(Boolean).join(" ");
    const content = text.slice(start, end);
    return className ? <mark className={className} key={`${start}-${end}`}>{content}</mark> : <span key={`${start}-${end}`}>{content}</span>;
  });
}

export function AnnotatedTweet({ report }: { report: AnalysisResult }) {
  const stats = report.stats;
  const visibleStats = stats && [stats.likes, stats.reposts, stats.replies, stats.views].some((value) => value !== undefined);
  const emotionReasons = report.highlights.filter((range) => range.kind === "emotion").slice(0, 6);
  return (
    <section className="paper-card tweet-case-card">
      <div className="card-kicker-row">
        <span className="eyebrow">Evidence · writing sample</span>
        {stats?.handle && <span className="handle-label">{stats.handle}</span>}
      </div>
      <div className="tweet-body" aria-label="Annotated tweet text">{paintTweet(report.text, report.highlights)}</div>
      <div className="annotation-legend" aria-label="Annotation key">
        <span><i className="legend-swatch hook-swatch" /> First-line hook</span>
        <span><i className="legend-swatch emotion-swatch" /> Trigger word</span>
      </div>
      {emotionReasons.length > 0 && (
        <div className="annotation-reasons">
          {emotionReasons.map((range, index) => <span key={`${range.start}-${index}`}>{range.reason}</span>)}
        </div>
      )}
      <div className="stats-divider" />
      <div className="engagement-head"><span className="eyebrow">Live engagement</span><span className="micro-label">Separate from writing score</span></div>
      {visibleStats ? (
        <>
          <dl className="engagement-stats">
            <div><dt>Likes</dt><dd>{compactNumber(stats?.likes)}</dd></div>
            <div><dt>Reposts</dt><dd>{compactNumber(stats?.reposts)}</dd></div>
            <div><dt>Replies</dt><dd>{compactNumber(stats?.replies)}</dd></div>
            <div><dt>Views</dt><dd>{compactNumber(stats?.views)}</dd></div>
          </dl>
          {report.engagement && <p className="engagement-estimate"><strong>{report.engagement.multiple.toFixed(1)}× expected</strong><span> · {report.engagement.baseline}; a rough estimate, not part of the score.</span></p>}
          {stats?.followers !== undefined && <p className="follower-note">Author followers at fetch: {compactNumber(stats.followers)}</p>}
        </>
      ) : (
        <p className="quiet-note">Engagement skipped — this text was added manually or no public counts were available.</p>
      )}
    </section>
  );
}
