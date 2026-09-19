"use client";

import { useEffect, useRef, useState } from "react";

const fmt = (n: number) => n.toLocaleString("en-US");

// Number Ticker: counts up on load and re-ticks when the nonce changes
// (a city switch re-renders the board, matching the approved preview).
// Reduced motion renders the final number directly, no count-up.
export default function Ticker({ value, nonce }: { value: number; nonce: number }) {
  const [display, setDisplay] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value <= 0) {
      setDisplay(value);
      return;
    }
    let cur = 0;
    setDisplay(0);
    const step = Math.max(1, Math.round(value / 42));
    timer.current = setInterval(() => {
      cur += step;
      if (cur >= value) {
        cur = value;
        if (timer.current) clearInterval(timer.current);
      }
      setDisplay(cur);
    }, 22);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [value, nonce]);

  return <div className="num">{fmt(display)}</div>;
}
