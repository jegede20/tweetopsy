import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header shell">
      <Logo />
      <nav className="main-nav" aria-label="Main navigation">
        <Link href="/compare">Compare</Link>
        <Link href="/draft">Draft check</Link>
        <Link href="/history">History</Link>
        <Link className="button button-outline nav-method" href="/method">Method</Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
