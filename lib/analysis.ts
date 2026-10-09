import {
  CHECK_WEIGHTS,
  EMOTION_LEXICON,
  ENGAGEMENT_BASELINES,
  HOOK_RULES,
  LENGTH_BANDS,
  STRUCTURE_RULES,
  VERDICTS,
} from "@/lib/config";
import type {
  AnalysisResult,
  CheckKey,
  CheckResult,
  EngagementEstimate,
  EngagementStats,
  FixSuggestion,
  HighlightRange,
  StructureResult,
} from "@/lib/types";

const clamp = (value: number, min = 0, max = 10) => Math.max(min, Math.min(max, value));
const round1 = (value: number) => Math.round(value * 10) / 10;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordCount = (value: string) => (value.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? []).length;

function firstLineRange(text: string) {
  const lineStart = text.search(/\S/);
  if (lineStart < 0) return { start: 0, end: 0, sample: "", line: "", wordCount: 0 };
  const rest = text.slice(lineStart);
  const newline = rest.indexOf("\n");
  const lineEnd = newline < 0 ? text.length : lineStart + newline;
  const line = text.slice(lineStart, lineEnd).trimEnd();
  const words = [...line.matchAll(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)];
  const end = words.length > 12 ? lineStart + words[11].index! + words[11][0].length : lineStart + line.length;
  return { start: lineStart, end, sample: text.slice(lineStart, end).trim(), line, wordCount: words.length };
}

function detectHook(text: string) {
  const range = firstLineRange(text);
  const sample = range.sample;
  if (!sample || wordCount(sample) === 0) return { range, pattern: null as (typeof HOOK_RULES)[number] | null, score: 0, reasons: [sample ? "No words to assess in the opening." : "Add a first line before scoring the opener."], highlights: [] as HighlightRange[] };
  const pattern = HOOK_RULES.find((rule) => new RegExp(rule.expression, "i").test(rule.key === "question" ? range.line : sample)) ?? null;
  const count = range.wordCount;
  let score = count <= 7 ? 6.7 : count <= 12 ? 6 : count <= 16 ? 5.3 : count <= 22 ? 4.4 : 3.4;
  if (pattern) score += pattern.key === "contrarian" || pattern.key === "numbered-list" ? 2.4 : 2.1;
  if (/\b\d+\b/.test(sample) || /\b(?:you|your)\b/i.test(sample)) score += 0.35;
  score = clamp(score);
  const reasons = pattern
    ? [`A ${pattern.label.toLowerCase()} opener gives readers a clear reason to continue.`]
    : ["The opening does not set up a clear question, contrast, list, or curiosity gap."];
  reasons.push(count <= 12
    ? `The first line stays compact at ${count} word${count === 1 ? "" : "s"}.`
    : `The first line runs to ${count} words; a tighter opening could land faster.`);
  const highlights: HighlightRange[] = range.end > range.start
    ? [{ start: range.start, end: range.end, kind: "hook", reason: pattern ? `${pattern.label} opener` : "First-line hook" }]
    : [];
  return { range, pattern, score, reasons, highlights };
}

function splitRhythmUnits(text: string) {
  const units = text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((part) => part.trim())
    .filter(Boolean);
  return units.map(wordCount).filter((count) => count > 0);
}

function analyzeRhythm(text: string, sentenceLengths: number[]): CheckResult {
  const weight = CHECK_WEIGHTS.rhythm;
  if (!sentenceLengths.length) {
    return { key: "rhythm", label: "Rhythm", score: 0, weight, reasons: ["No words to measure yet."], highlights: [] };
  }
  const avg = sentenceLengths.reduce((sum, value) => sum + value, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((sum, value) => sum + (value - avg) ** 2, 0) / sentenceLengths.length;
  const coefficient = avg ? Math.sqrt(variance) / avg : 0;
  let score = 9.2 - Math.abs(avg - 8) * 0.42;
  if (sentenceLengths.length > 1) score += coefficient >= 0.25 && coefficient <= 1.1 ? 1.1 : coefficient < 0.25 ? -0.8 : -0.35;
  else score -= 1.2;
  const last = sentenceLengths[sentenceLengths.length - 1];
  if (sentenceLengths.length > 1 && last <= 8) score += 0.7;
  if (avg > 19) score -= (avg - 19) * 0.16;
  score = clamp(score);
  const reasons: string[] = [];
  if (sentenceLengths.length === 1) reasons.push("One continuous beat leaves little room for pace contrast.");
  else if (coefficient >= 0.25) reasons.push("Sentence lengths vary, giving the post a more deliberate pace.");
  else reasons.push("Most lines land at a similar length; a short interruption could add punch.");
  reasons.push(avg > 16
    ? `The average is about ${round1(avg)} words per beat; consider breaking up the longer run.`
    : `The average beat is about ${round1(avg)} words, which is easy to scan.`);
  if (sentenceLengths.length > 1 && last <= 8) reasons.push("A short final beat gives the ending a clean stop.");
  return { key: "rhythm", label: "Rhythm", score: round1(score), weight, reasons, highlights: [] };
}

function findEmotionMatches(text: string) {
  const matches: Array<{ word: string; group: string; start: number; end: number }> = [];
  for (const [group, words] of Object.entries(EMOTION_LEXICON)) {
    for (const word of words) {
      const escaped = escapeRegExp(word).replace(/\ /g, "\\s+");
      const expression = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escaped})(?=$|[^\\p{L}\\p{N}_])`, "giu");
      for (const match of text.matchAll(expression)) {
        const start = match.index! + match[1].length;
        matches.push({ word: match[2], group, start, end: start + match[2].length });
      }
    }
  }
  const unique = new Map<string, (typeof matches)[number]>();
  for (const match of matches) unique.set(`${match.start}:${match.end}`, match);
  return [...unique.values()].sort((a, b) => a.start - b.start || a.end - b.end);
}

function analyzeEmotion(text: string) {
  const matches = findEmotionMatches(text);
  const groups = [...new Set(matches.map((match) => match.group))];
  const words = Math.max(1, wordCount(text));
  const density = matches.length / words;
  let score = matches.length === 0 ? 3.2 : 4.4 + Math.min(2.7, matches.length * 0.8) + Math.min(1.7, Math.max(0, groups.length - 1) * 0.7);
  if (density > 0.32) score -= 1.1;
  else if (density > 0.08) score += 0.4;
  score = clamp(score);
  const reasons = matches.length === 0
    ? ["No clear emotional trigger words surfaced in the original lexicon.", "A specific curiosity, cost, or aspiration can make the stakes easier to feel."]
    : [`${matches.length} trigger${matches.length === 1 ? "" : "s"} across ${groups.length} emotional group${groups.length === 1 ? "" : "s"}: ${groups.join(", ")}.`, density > 0.32 ? "The emotional language is dense; one precise trigger may be stronger than several." : "The language gives readers a clear emotional handle without crowding the post."];
  const highlights: HighlightRange[] = matches.map((match) => ({
    start: match.start,
    end: match.end,
    kind: "emotion",
    reason: `${match.group} trigger: “${match.word}”`,
  }));
  return { score: round1(score), reasons, highlights, matches };
}

function matchRule(expression: string, text: string) {
  return new RegExp(expression, "i").test(text);
}

function detectStructure(text: string): StructureResult {
  const trimmed = text.trim();
  const rules: Array<{ key: string; label: string; matched: boolean }> = [
    { key: "list", label: "List", matched: matchRule(STRUCTURE_RULES.list, trimmed) },
    { key: "howTo", label: "How-to", matched: matchRule(STRUCTURE_RULES.howTo, trimmed) },
    { key: "question", label: "Question", matched: matchRule(STRUCTURE_RULES.question, trimmed) },
    { key: "contrarian", label: "Contrarian take", matched: matchRule(STRUCTURE_RULES.contrarian, trimmed) },
    { key: "story", label: "Story", matched: matchRule(STRUCTURE_RULES.story, trimmed) },
  ];
  const firstWord = (trimmed.match(/^[\p{L}']+/u)?.[0] ?? "").toLowerCase();
  if ((STRUCTURE_RULES.commandWords as readonly string[]).includes(firstWord)) {
    rules.push({ key: "command", label: "Command", matched: true });
  }
  const detected = rules.filter((rule) => rule.matched).map((rule) => rule.label);
  const selected = rules.find((rule) => rule.matched);
  return {
    key: selected?.key ?? "default",
    label: selected?.label ?? "Open thought",
    detected,
  };
}

function analyzeStructure(structure: StructureResult): CheckResult {
  const weight = CHECK_WEIGHTS.structure;
  const count = structure.detected.length;
  let score = count === 0 ? 4.2 : count === 1 ? 8.8 : count === 2 ? 6.8 : 4.8;
  const reasons = count === 0
    ? ["No single structure stands out yet; choose a list, question, story, or how-to path."]
    : count === 1
      ? [`The ${structure.label.toLowerCase()} structure is easy to recognize and follow.`]
      : [`Several structures compete (${structure.detected.join(", ")}); one clear path may be easier to follow.`];
  if (count === 1 && structure.key === "list") score += 0.4;
  return { key: "structure", label: "Structure", score: round1(clamp(score)), weight, reasons, highlights: [] };
}

function bandFor(structure: StructureResult) {
  const key = structure.key as keyof typeof LENGTH_BANDS;
  return LENGTH_BANDS[key] ?? LENGTH_BANDS.default;
}

function analyzeLength(text: string, structure: StructureResult) {
  const band = bandFor(structure);
  const actual = Array.from(text.trim()).length;
  let score: number;
  if (!actual) score = 0;
  else if (actual >= band.min && actual <= band.max) score = 9.5;
  else if (actual < band.min) score = clamp(9.5 - ((band.min - actual) / band.min) * 7.5, 1, 9.5);
  else score = clamp(9.5 - ((actual - band.max) / band.max) * 7.5, 1, 9.5);
  const reasons = !actual
    ? ["Add text to compare its length with the structure-specific band."]
    : actual >= band.min && actual <= band.max
      ? [`${actual} characters sits inside the ${band.min}–${band.max} character band for a ${structure.label.toLowerCase()}.`]
      : actual < band.min
        ? `${actual} characters is below the ${band.min}–${band.max} character band for a ${structure.label.toLowerCase()}. Consider adding one useful detail.`
        : `${actual} characters is above the ${band.min}–${band.max} character band for a ${structure.label.toLowerCase()}. Look for a sentence to trim.`;
  return {
    score: round1(score),
    result: { actual, min: band.min, max: band.max, structure: structure.label },
    reasons: Array.isArray(reasons) ? reasons : [reasons],
  };
}

function engagementEstimate(stats?: EngagementStats | null): EngagementEstimate | null {
  if (!stats) return null;
  const interactionFieldsExist = stats.likes !== undefined || stats.reposts !== undefined || stats.replies !== undefined;
  if (!interactionFieldsExist) return null;
  const actualInteractions = (stats.likes ?? 0) + (stats.reposts ?? 0) + (stats.replies ?? 0);
  const views = stats.views && stats.views > 0 ? stats.views : undefined;
  const followers = stats.followers && stats.followers > 0 ? stats.followers : undefined;
  const baselineRate = views ? ENGAGEMENT_BASELINES.viewsRate : followers ? ENGAGEMENT_BASELINES.followerRate : 0;
  const denominator = views ?? followers;
  if (!denominator || !baselineRate) return null;
  const expectedInteractions = denominator * baselineRate;
  return {
    multiple: expectedInteractions > 0 ? actualInteractions / expectedInteractions : 0,
    baseline: views ? "estimated from views" : "estimated from followers",
    actualInteractions,
    expectedInteractions,
  };
}

function suggestionsFor(checks: Record<CheckKey, CheckResult>, length: { min: number; max: number; structure: string }) {
  const advice: Record<CheckKey, string> = {
    hook: "Your hook is soft. Try opening with a sharper contrast, a concrete question, or a specific promise.",
    rhythm: "Break up long stretches; alternate a short line with a fuller explanation, then keep the closer brief.",
    emotion: "The emotional stakes are muted. Name a specific cost, desire, surprise, or consequence.",
    structure: "Choose one clear path: a list, a short story, a question, a command, or a how-to.",
    length: `Move toward the ${length.min}–${length.max} character band for a ${length.structure.toLowerCase()}; trim or add one useful detail.`,
  };
  return (Object.values(checks) as CheckResult[])
    .filter((check) => check.score < 7)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((check): FixSuggestion => ({ check: check.key, label: check.label, advice: advice[check.key] }));
}

export function analyze(text: string, stats?: EngagementStats | null): AnalysisResult {
  const safeText = typeof text === "string" ? text : "";
  const hook = detectHook(safeText);
  const sentenceLengths = splitRhythmUnits(safeText);
  const rhythm = analyzeRhythm(safeText, sentenceLengths);
  const emotion = analyzeEmotion(safeText);
  const structure = detectStructure(safeText);
  const structureCheck = analyzeStructure(structure);
  const length = analyzeLength(safeText, structure);
  const lengthCheck: CheckResult = {
    key: "length",
    label: "Length",
    score: length.score,
    weight: CHECK_WEIGHTS.length,
    reasons: length.reasons,
    highlights: [],
  };
  const hookCheck: CheckResult = {
    key: "hook",
    label: "Hook",
    score: round1(hook.score),
    weight: CHECK_WEIGHTS.hook,
    reasons: hook.reasons,
    highlights: hook.highlights,
  };
  const emotionCheck: CheckResult = {
    key: "emotion",
    label: "Emotion",
    score: emotion.score,
    weight: CHECK_WEIGHTS.emotion,
    reasons: emotion.reasons,
    highlights: emotion.highlights,
  };
  const checks: Record<CheckKey, CheckResult> = {
    hook: hookCheck,
    rhythm,
    emotion: emotionCheck,
    structure: structureCheck,
    length: lengthCheck,
  };
  const hasWords = wordCount(safeText) > 0;
  if (!hasWords) {
    const emptyReasons: Record<CheckKey, string[]> = {
      hook: ["Add words before assessing the opening."],
      rhythm: ["There are no words to measure yet."],
      emotion: ["No emotional triggers can be assessed without words."],
      structure: ["Add a sentence or phrase to identify a structure."],
      length: ["Add text to compare its length with the structure-specific band."],
    };
    for (const check of Object.values(checks)) {
      check.score = 0;
      check.reasons = emptyReasons[check.key];
    }
  }
  const total = hasWords ? Object.values(checks).reduce((sum, check) => sum + (check.score / 10) * check.weight, 0) : 0;
  const score = Math.round(total);
  const verdict = VERDICTS.find((item) => score >= item.min)?.label ?? "Flat";
  const highest = (Object.values(checks) as CheckResult[]).reduce((best, item) => item.score > best.score ? item : best);
  const patternLabel = hook.pattern?.label;
  const causeByCheck: Record<CheckKey, string> = {
    hook: patternLabel ? `${patternLabel} hook` : "Clear first line",
    rhythm: "Punchy rhythm",
    emotion: emotion.matches.length ? `${emotion.matches[0].group} trigger` : "Measured tone",
    structure: `${structure.label} structure`,
    length: "Length fit",
  };
  const highlights = [...hook.highlights, ...emotion.highlights].sort((a, b) => a.start - b.start);
  const normalizedStats = stats ? {
    likes: stats.likes,
    reposts: stats.reposts,
    replies: stats.replies,
    views: stats.views,
    followers: stats.followers,
    handle: stats.handle,
  } : null;
  return {
    text: safeText,
    score,
    verdict,
    cause: !hasWords ? "No text to assess" : hook.pattern ? `${hook.pattern.label} hook` : causeByCheck[highest.key],
    hookPattern: hook.pattern?.label ?? null,
    structure,
    checks,
    highlights,
    sentenceLengths,
    length: length.result,
    stats: normalizedStats,
    engagement: engagementEstimate(normalizedStats),
    suggestions: suggestionsFor(checks, length.result),
  };
}
