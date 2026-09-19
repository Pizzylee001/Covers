// Pure relative-time helper. Deterministic given (iso, now), so the server
// computes each label once and the client renders that exact string first.
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
