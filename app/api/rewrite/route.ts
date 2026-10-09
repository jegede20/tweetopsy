import { NextResponse } from "next/server";
import { MAX_TWEET_LENGTH_FOR_AI } from "@/lib/config";
import { allowRequest, clientAddress } from "@/lib/rate-limit";
import type { RewriteResult } from "@/lib/types";

export const runtime = "nodejs";

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validateRewrite(value: unknown): RewriteResult | null {
  if (!value || typeof value !== "object") return null;
  const object = value as Record<string, unknown>;
  const summary = cleanString(object.summary, 320);
  if (!summary) return null;
  const rawRewrites = Array.isArray(object.rewrites) ? object.rewrites : [];
  const rewrites = rawRewrites.slice(0, 3).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const rewrite = item as Record<string, unknown>;
    const before = cleanString(rewrite.before, 800);
    const after = cleanString(rewrite.after, 800);
    const reason = cleanString(rewrite.reason, 180);
    return before && after ? [{ before, after, reason: reason || "A tighter version that keeps the original point." }] : [];
  });
  if (!rewrites.length) return null;
  return { summary, rewrites };
}

function parseJson(content: unknown): unknown {
  if (typeof content !== "string") return null;
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(cleaned); } catch { return null; }
}

export async function POST(request: Request) {
  const address = clientAddress(request);
  const rate = allowRequest(`rewrite:${address}`, 6, 10 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ code: "RATE_LIMITED", message: "AI rewrite is rate limited for now. The rules-based analysis still works." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  }

  const maxBodyLength = MAX_TWEET_LENGTH_FOR_AI * 3 + 2_000;
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > maxBodyLength) return NextResponse.json({ message: "The rewrite request is too long." }, { status: 413 });
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > maxBodyLength) return NextResponse.json({ message: "The rewrite request is too long." }, { status: 413 });
    body = JSON.parse(raw);
  } catch { return NextResponse.json({ message: "AI rewrite unavailable." }, { status: 400 }); }
  const requestBody = body as { text?: unknown; weaknesses?: unknown };
  const text = cleanString(requestBody?.text, MAX_TWEET_LENGTH_FOR_AI);
  if (!text) return NextResponse.json({ message: "Add tweet text before requesting an AI rewrite." }, { status: 400 });
  const weaknesses = Array.isArray(requestBody.weaknesses)
    ? requestBody.weaknesses.filter((item): item is string => typeof item === "string").slice(0, 5).map((item) => item.trim().slice(0, 180)).filter(Boolean)
    : [];
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ code: "AI_UNAVAILABLE", message: "AI rewrite unavailable. Add a server-side GROQ_API_KEY to enable optional rewrites." }, { status: 503 });

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  const prompt = {
    tweet: text,
    detected_weaknesses: weaknesses,
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 650,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are an editorial assistant for Tweetopsy, a writing-forensics tool. Return one valid JSON object with keys summary (one plain-language sentence) and rewrites (an array of 1 to 3 objects with before, after, reason). Keep the writer's meaning, don't invent facts, and make restrained edits. Never promise reach or virality. Keep each rewrite under 280 characters when possible. Return JSON only.",
          },
          { role: "user", content: JSON.stringify(prompt) },
        ],
      }),
    });
    if (!response.ok) {
      const status = response.status;
      const message = status === 429 ? "AI rewrite unavailable right now (Groq rate limit). Your rules-based report is ready." : "AI rewrite unavailable right now. Your rules-based report is ready.";
      return NextResponse.json({ code: status === 429 ? "RATE_LIMITED" : "AI_UNAVAILABLE", message }, { status: status === 429 ? 429 : 503 });
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const validated = validateRewrite(parseJson(content));
    if (!validated) return NextResponse.json({ code: "AI_UNAVAILABLE", message: "AI rewrite unavailable; the response could not be validated." }, { status: 502 });
    return NextResponse.json(validated);
  } catch {
    return NextResponse.json({ code: "AI_UNAVAILABLE", message: "AI rewrite unavailable right now. Your rules-based report is ready." }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
