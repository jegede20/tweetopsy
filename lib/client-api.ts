import type { EngagementStats, RewriteResult } from "@/lib/types";
import { isTweetUrl } from "@/lib/format";

export interface FetchedTweet {
  text: string;
  stats: EngagementStats | null;
  source: "FxTwitter" | "oEmbed";
}

export async function fetchTweet(url: string): Promise<FetchedTweet> {
  if (!isTweetUrl(url)) throw new Error("Enter a valid x.com or twitter.com status link.");
  const response = await fetch("/api/tweet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? "We couldn't fetch that post. You can paste its text instead.");
  return data as FetchedTweet;
}

export async function requestRewrite(text: string, weaknesses: string[]): Promise<RewriteResult> {
  const response = await fetch("/api/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, weaknesses }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? "AI rewrite unavailable.");
  return data as RewriteResult;
}
