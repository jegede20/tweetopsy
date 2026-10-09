"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { analyze } from "@/lib/analysis";
import { isTweetUrl } from "@/lib/format";
import { fetchTweet } from "@/lib/client-api";
import { saveCase } from "@/lib/storage";

export function AnalyzeForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [manualText, setManualText] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"error" | "note">("error");

  function openReport(text: string, stats?: Parameters<typeof analyze>[1], sourceUrl?: string) {
    const saved = saveCase(analyze(text, stats), sourceUrl);
    router.push(`/report?case=${encodeURIComponent(saved.id)}`);
  }

  async function submitLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!isTweetUrl(url)) {
      setKind("error");
      setMessage("That link doesn't look like an x.com or twitter.com status URL.");
      setManualOpen(true);
      return;
    }
    setBusy(true);
    try {
      const tweet = await fetchTweet(url);
      openReport(tweet.text, tweet.stats, url);
    } catch (caught) {
      setKind("note");
      setMessage(caught instanceof Error ? caught.message : "We couldn't fetch that post. Paste the text manually to continue.");
      setManualOpen(true);
    } finally {
      setBusy(false);
    }
  }

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manualText.trim()) {
      setKind("error");
      setMessage("Paste the tweet text first.");
      return;
    }
    openReport(manualText.trim());
  }

  return (
    <div className="analyze-form-wrap">
      <form className="analyze-form" onSubmit={submitLink}>
        <label className="sr-only" htmlFor="tweet-url">Tweet link</label>
        <input id="tweet-url" className="pill-input" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste an X / Twitter link" autoComplete="url" inputMode="url" />
        <button className="button button-primary run-button" type="submit" disabled={busy}>{busy ? <><span className="button-spinner" aria-hidden="true" /> Fetching…</> : "Run autopsy"}</button>
      </form>
      {message && <p className={`form-message ${kind === "error" ? "message-error" : "message-note"}`} role="status">{message}</p>}
      <button className="text-button manual-toggle" type="button" onClick={() => setManualOpen((open) => !open)} aria-expanded={manualOpen}>{manualOpen ? "Close manual paste" : "Or paste tweet text instead"}</button>
      {manualOpen && <form className="manual-form" onSubmit={submitManual}>
        <label className="eyebrow" htmlFor="manual-tweet">Manual text · engagement skipped</label>
        <textarea id="manual-tweet" className="text-area" value={manualText} onChange={(event) => setManualText(event.target.value)} placeholder="Paste the full tweet text here…" rows={4} />
        <div className="manual-form-bottom"><span className="micro-label">{Array.from(manualText).length} characters</span><button className="button button-outline" type="submit">Analyze text</button></div>
      </form>}
      <p className="privacy-note">No account needed. Text analysis runs in your browser; no tracking or ads.</p>
    </div>
  );
}
