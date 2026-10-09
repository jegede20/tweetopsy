import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="site-footer shell">
      <div className="footer-brand"><LogoMark size={24} /><span>Tweetopsy</span></div>
      <p>Virality forensics. The score measures the writing, not future reach.</p>
      <div className="footer-links"><Link href="/method">Method</Link><Link href="/history">Your history</Link><Link href="/draft">Draft check</Link></div>
    </footer>
  );
}
