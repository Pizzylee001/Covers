"use client";

// Retry re-runs the request by reloading the page. The page renders
// server-side on every request, so a reload is the poll.
export default function RetryButton({ label = "Retry" }: { label?: string }) {
  return (
    <button type="button" className="retry" onClick={() => window.location.reload()}>
      {label}
    </button>
  );
}
