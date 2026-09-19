"use client";

import { useEffect, useState } from "react";
import { relTime } from "@/lib/time";

// Relative last-check-in label. The server computes `initial` once and passes
// it down as a plain prop, so the first client render is byte-identical to the
// server HTML. The interval starts only after mount and refreshes every 30s.
export default function RelativeTime({ iso, initial }: { iso: string; initial: string }) {
  const [label, setLabel] = useState(initial);
  useEffect(() => {
    setLabel(relTime(iso));
    const id = setInterval(() => setLabel(relTime(iso)), 30_000);
    return () => clearInterval(id);
  }, [iso]);
  return <span>{label}</span>;
}
