import type { AnalysisResult, SavedCase } from "@/lib/types";

export function compactNumber(value?: number) {
  if (value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en", { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function copySummary(report: AnalysisResult | SavedCase, caseNumber?: string) {
  const handle = report.stats?.handle ? ` ${report.stats.handle}` : "";
  const caseLabel = caseNumber ? `Case no. ${caseNumber} · ` : "";
  const strongest = Object.values(report.checks).sort((a, b) => b.score - a.score)[0];
  return `${caseLabel}Tweetopsy — Virality forensics\nWriting score: ${report.score}/100 · ${report.verdict}\nCause: ${report.cause}${handle}\nStrongest check: ${strongest.label} (${strongest.score}/10) — ${strongest.reasons[0]}\n${report.text}`;
}

export function isTweetUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return !url.username && !url.password && ["x.com", "twitter.com"].includes(host) && /\/[^/]+\/status\/\d+/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function isUrlLike(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
