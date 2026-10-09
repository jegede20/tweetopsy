"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareCard } from "@/components/ShareCard";
import { getCase } from "@/lib/storage";
import type { SavedCase } from "@/lib/types";

export default function SharePage() {
  const [item, setItem] = useState<SavedCase | null>(null);
  useEffect(() => setItem(getCase(new URLSearchParams(window.location.search).get("case"))), []);
  return (
    <>
      <SiteHeader />
      <main className="shell page-shell share-page">
        <Link href={item ? `/report?case=${encodeURIComponent(item.id)}` : "/"} className="button button-outline back-button">← Back to case</Link>
        <header className="page-heading"><span className="eyebrow eyebrow-rule">Share card</span><h1>A case worth <em>sharing.</em></h1><p>Download a toe-tag card or copy it to your clipboard. Case details remain private to this device.</p></header>
        {item ? <div className="standalone-share-card"><ShareCard report={item} caseNumber={item.caseNumber} /></div> : <div className="empty-state"><h2>Case not found on this device.</h2><p>Share cards are generated locally; there are no public report links.</p><Link href="/history" className="button button-primary">Open history</Link></div>}
      </main>
      <SiteFooter />
    </>
  );
}
