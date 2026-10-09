"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem("tweetopsy-theme"); } catch { /* theme still follows the system */ }
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { window.localStorage.setItem("tweetopsy-theme", next ? "dark" : "light"); } catch { /* theme remains active for this session */ }
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggle} aria-label={`Switch to ${dark ? "light" : "dark"} theme`} title={`Switch to ${dark ? "light" : "dark"} theme`}>
      <span aria-hidden="true">{dark ? "☼" : "◐"}</span>
    </button>
  );
}
