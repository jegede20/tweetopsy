import { NextResponse } from "next/server";
import { allowRequest, clientAddress } from "@/lib/rate-limit";
import type { EngagementStats } from "@/lib/types";

export const runtime = "nodejs";

type JsonObject = Record<string, unknown>;
const asObject = (value: unknown): JsonObject | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;

function parseStatusUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || !["x.com", "twitter.com"].includes(host)) return null;
    const match = url.pathname.match(/^\/([^/]+)\/status\/(\d+)(?:\/|$)/i);
    if (!match) return null;
    return { url: url.toString(), user: match[1], id: match[2] };
  } catch {
    return null;
  }
}

async function timedFetch(url: string, timeoutMs = 6500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, cache: "no-store", headers: { "User-Agent": "Tweetopsy/1.0" } });
  } finally {
    clearTimeout(timeout);
  }
}

function numeric(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function fxTweetData(payload: unknown) {
  const root = asObject(payload);
  if (!root) return null;
  const tweet = asObject(root.tweet) ?? root;
  const author = asObject(tweet.author) ?? asObject(root.author) ?? asObject(tweet.user) ?? asObject(root.user) ?? {};
  const noteTweet = asObject(tweet.note_tweet);
  const content = asObject(tweet.content);
  const nestedTweet = asObject(tweet.tweet);
  const possibleText = [tweet.text, tweet.full_text, noteTweet?.text, content?.text, nestedTweet?.text];
  const text = possibleText.find((value): value is string => typeof value === "string" && Boolean(value.trim()));
  if (!text) return null;
  const legacy = asObject(tweet.legacy) ?? {};
  const rawHandle = author.screen_name ?? author.username ?? tweet.screen_name ?? root.screen_name;
  const stats: EngagementStats = {
    likes: numeric(tweet.likes, tweet.like_count, tweet.favorite_count, legacy.favorite_count),
    reposts: numeric(tweet.retweets, tweet.retweet_count, legacy.retweet_count),
    replies: numeric(tweet.replies, tweet.reply_count, legacy.reply_count),
    views: numeric(tweet.views, tweet.view_count, tweet.views_count),
    followers: numeric(author.followers, author.followers_count, author.followersCount),
    handle: typeof rawHandle === "string" && rawHandle ? (rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`) : undefined,
  };
  const hasStats = Object.values(stats).some((value) => value !== undefined);
  return { text: text.trim(), stats: hasStats ? stats : null };
}

function decodeEntities(text: string) {
  const named: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  };
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === "#") {
      const number = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(number) ? String.fromCodePoint(number) : entity;
    }
    return named[code.toLowerCase()] ?? entity;
  });
}

function oembedText(html: unknown) {
  if (typeof html !== "string") return "";
  return decodeEntities(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|blockquote|div)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

export async function POST(request: Request) {
  const address = clientAddress(request);
  const rate = allowRequest(`tweet:${address}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ code: "RATE_LIMITED", message: "Too many fetches just now. Wait a minute or paste the tweet text manually." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 4096) return NextResponse.json({ code: "INVALID_REQUEST", message: "Send a valid tweet link." }, { status: 413 });
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return NextResponse.json({ code: "INVALID_REQUEST", message: "Send a valid tweet link." }, { status: 413 });
    body = JSON.parse(raw);
  } catch { return NextResponse.json({ code: "INVALID_REQUEST", message: "Send a valid tweet link." }, { status: 400 }); }
  const inputUrl = asObject(body)?.url;
  const status = parseStatusUrl(inputUrl);
  if (!status) return NextResponse.json({ code: "INVALID_LINK", message: "Use a valid x.com or twitter.com status link." }, { status: 400 });

  let fxStatus = 0;
  try {
    const response = await timedFetch(`https://api.fxtwitter.com/${encodeURIComponent(status.user)}/status/${status.id}`);
    fxStatus = response.status;
    if (response.ok) {
      const data = fxTweetData(await response.json());
      if (data) return NextResponse.json({ ...data, source: "FxTwitter" });
    }
  } catch {
    // Continue to the permitted text-only oEmbed fallback.
  }

  let oembedStatus = 0;
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(status.url)}&omit_script=true`;
    const response = await timedFetch(oembedUrl);
    oembedStatus = response.status;
    if (response.ok) {
      const data: unknown = await response.json();
      const text = oembedText(asObject(data)?.html);
      if (text) return NextResponse.json({ text, stats: null, source: "oEmbed" });
    }
  } catch {
    // A manual paste is the final supported fallback; no direct X scraping.
  }

  const statuses = [fxStatus, oembedStatus].filter(Boolean);
  const bothMissing = statuses.length === 2 && statuses.every((statusCode) => statusCode === 404 || statusCode === 410);
  const wasRateLimited = fxStatus === 429 || oembedStatus === 429;
  const code = wasRateLimited ? "RATE_LIMITED" : bothMissing ? "NOT_FOUND" : "FETCH_FAILED";
  const message = wasRateLimited
    ? "The tweet service is rate limited. Please wait a moment, or paste the tweet text manually."
    : bothMissing
      ? "Tweet not found, deleted, private, or protected. Paste the text manually to continue."
      : "We couldn't retrieve that post. It may be private, protected, or temporarily unavailable. Paste its text to continue.";
  return NextResponse.json({ code, message }, { status: wasRateLimited ? 429 : bothMissing ? 404 : 502 });
}
