export type CheckKey = "hook" | "rhythm" | "emotion" | "structure" | "length";
export type HighlightKind = "hook" | "emotion";

export interface HighlightRange {
  start: number;
  end: number;
  kind: HighlightKind;
  reason: string;
}

export interface CheckResult {
  key: CheckKey;
  label: string;
  score: number;
  weight: number;
  reasons: string[];
  highlights: HighlightRange[];
}

export interface EngagementStats {
  likes?: number;
  reposts?: number;
  replies?: number;
  views?: number;
  followers?: number;
  handle?: string;
}

export interface StructureResult {
  key: string;
  label: string;
  detected: string[];
}

export interface LengthResult {
  actual: number;
  min: number;
  max: number;
  structure: string;
}

export interface EngagementEstimate {
  multiple: number;
  baseline: string;
  actualInteractions: number;
  expectedInteractions: number;
}

export interface FixSuggestion {
  check: CheckKey;
  label: string;
  advice: string;
}

export interface AnalysisResult {
  text: string;
  score: number;
  verdict: string;
  cause: string;
  hookPattern: string | null;
  structure: StructureResult;
  checks: Record<CheckKey, CheckResult>;
  highlights: HighlightRange[];
  sentenceLengths: number[];
  length: LengthResult;
  stats: EngagementStats | null;
  engagement: EngagementEstimate | null;
  suggestions: FixSuggestion[];
}

export interface SavedCase extends AnalysisResult {
  id: string;
  caseNumber: string;
  createdAt: string;
  sourceUrl?: string;
}

export interface RewriteResult {
  summary: string;
  rewrites: Array<{ before: string; after: string; reason: string }>;
}
