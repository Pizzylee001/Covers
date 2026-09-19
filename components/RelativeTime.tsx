"use client";

import { useEffect, useState } from "react";

export function relTime(iso: string | null): string {
  if (!iso) return "";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const h = Math.floor(mins / 60);
  return h + "h " + (mins % 60) + "m ago";
}

// Relative last-check-in label. Renders the server-computed string first
// (no hydration mismatch), then refreshes itself every 30 seconds.
export default function RelativeTime({ iso, initial }: { iso: string; initial: string }) {
  const [label, setLabel] = useState(initial);
  useEffect(() => {
    setLabel(relTime(iso));
    const id = setInterval(() => setLabel(relTime(iso)), 30_000);
    return () => clearInterval(id);
  }, [iso]);
  return <span>{label}</span>;
}
