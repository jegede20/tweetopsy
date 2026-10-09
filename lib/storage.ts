import { MAX_HISTORY } from "@/lib/config";
import type { AnalysisResult, SavedCase } from "@/lib/types";

const HISTORY_KEY = "tweetopsy-cases-v1";
const SEQUENCE_KEY = "tweetopsy-case-sequence-v1";
let volatileHistory: SavedCase[] = [];

export function loadHistory(): SavedCase[] {
  if (typeof window === "undefined") return [];
  let saved: SavedCase[] = [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]");
    if (Array.isArray(parsed)) saved = parsed as SavedCase[];
  } catch {
    // Private browsing or damaged local data should not prevent an in-session case from opening.
  }
  const known = new Set(saved.map((item) => item.id));
  const merged = [...volatileHistory.filter((item) => !known.has(item.id)), ...saved];
  return merged.slice(0, MAX_HISTORY);
}

export function saveCase(analysis: AnalysisResult, sourceUrl?: string): SavedCase {
  const history = loadHistory();
  let storedSequence = 0;
  try {
    const candidate = Number(window.localStorage.getItem(SEQUENCE_KEY) ?? "0");
    if (Number.isFinite(candidate)) storedSequence = candidate;
  } catch { /* storage may be unavailable */ }
  const highestHistoryNumber = history.reduce((max, item) => Math.max(max, Number(item.caseNumber) || 0), 0);
  const nextNumber = Math.max(storedSequence, highestHistoryNumber) + 1;
  const saved: SavedCase = {
    ...analysis,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    caseNumber: String(nextNumber).padStart(4, "0"),
    createdAt: new Date().toISOString(),
    ...(sourceUrl ? { sourceUrl } : {}),
  };
  volatileHistory = [saved, ...volatileHistory.filter((item) => item.id !== saved.id)].slice(0, MAX_HISTORY);
  try {
    window.localStorage.setItem(SEQUENCE_KEY, String(nextNumber));
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify([saved, ...history].slice(0, MAX_HISTORY)));
  } catch {
    // The case remains available in memory for this session, but cannot persist between visits.
  }
  return saved;
}

export function getCase(id?: string | null): SavedCase | null {
  const history = loadHistory();
  if (!history.length) return null;
  return id ? history.find((item) => item.id === id) ?? null : history[0];
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  volatileHistory = [];
  try { window.localStorage.removeItem(HISTORY_KEY); } catch { /* storage may be unavailable */ }
}
