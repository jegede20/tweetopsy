# Tweetopsy

**Virality forensics.** Tweetopsy is a responsive, browser-first case file for inspecting the writing mechanics of a tweet. The rules engine runs locally; engagement metrics are kept separate from the writing score. The score is not a forecast of future reach.

## Run locally

```bash
npm install
cp .env.example .env.local # optional; leave GROQ_API_KEY blank to run without AI
npm run dev
```

Open http://localhost:3000. Tweet links are fetched server-side from FxTwitter, with Twitter oEmbed as a text-only fallback. If neither service can provide the post, paste the text manually. The app does not scrape X.

## Optional AI rewrites

Only a deliberate click on **Request AI rewrite** sends the post text and detected writing weaknesses to `/api/rewrite`. Set `GROQ_API_KEY` in `.env.local` or the Vercel project environment. The key is server-only. AI output is optional; all scoring, annotations, suggestions, compare results, and history work without it. Groq requests have a timeout, bounded input, JSON validation, and simple per-instance rate limiting.

Groq's free-tier model availability changes. As of October 2026, the Llama models are no longer available on the free tier, so this project defaults to the currently free-tier-compatible `openai/gpt-oss-20b`. Set `GROQ_MODEL` to another model enabled for your account if needed.

## Checks

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Architecture

- `lib/analysis.ts` is a pure, client-safe TypeScript scoring engine.
- `lib/config.ts` contains the weights, hook patterns, original emotion vocabulary, length bands, and engagement baselines.
- `/api/tweet` validates supported X URLs and tries FxTwitter before text-only oEmbed.
- `/api/rewrite` is the only Groq integration and never exposes the API key.
- Case history and case numbering live only in the browser's localStorage (latest 50).
- No accounts, database, analytics, or advertising. Vercel's free tier is sufficient for a small deployment.
