"use client";

import { useState } from "react";
import RelativeTime from "./RelativeTime";
import RetryButton from "./RetryButton";
import Ticker from "./Ticker";

// Serializable bundle computed on the server in app/page.tsx: plain data plus
// every relative-time label already resolved. The client hydrates from this,
// so its first render matches the server HTML with no clock skew.
export type BundleVenue = {
  name: string;
  cuisine: string;
  visits: number;
  last: string | null;
  lastLabel: string;
};
export type BundleNeighborhood = {
  name: string;
  covers: number;
  venues: BundleVenue[];
};
export type BundleCity = {
  name: string;
  covers: number;
  neighborhoods: BundleNeighborhood[];
};
export type PageBundle = {
  stale: boolean;
  generatedAt: string;
  windowMinutes: number;
  total: number;
  fetchedAt: string;
  pulledLabel: string;
  cities: BundleCity[];
};

const fmt = (n: number) => n.toLocaleString("en-US");

// "1 cover" when singular, "N covers" otherwise.
const coversWord = (n: number) => (n === 1 ? "cover" : "covers");

const cityLabel = (name: string) => name.replace(/, [A-Z]{2}$/, "");

const intensity = (covers: number, max: number) =>
  Math.round(34 + (max > 0 ? covers / max : 0) * 66);

const genAt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

type Props = { bundle: PageBundle | null };

export default function PageShell({ bundle }: Props) {
  const [cityIdx, setCityIdx] = useState(0);
  const [nonce, setNonce] = useState(0);

  const stale = bundle?.stale ?? false;
  const data = bundle;
  const city: BundleCity | null =
    data && data.cities.length
      ? data.cities[Math.min(cityIdx, data.cities.length - 1)]
      : null;

  const selectCity = (i: number) => {
    setCityIdx(i);
    setNonce((n) => n + 1); // re-tick the number, re-grow the meters
  };

  const liveLabel = !bundle ? "Offline" : stale ? "Stale" : "Live";
  const dotClass = stale || !bundle ? "dot stale" : "dot";

  return (
    <>
      <header className="masthead">
        <div className="wrap">
          <a className="wordmark" href="#">
            <span className="mark" aria-hidden="true" />
            Covers
          </a>
          <span className="spacer" />
          <span className="live">
            <span className={dotClass} aria-hidden="true" />
            {liveLabel}
          </span>
          <a className="powered" href="https://flynet.org" target="_blank" rel="noopener">
            Powered by Flynet
          </a>
        </div>
      </header>

      <main className="wrap">
        <section className="hero" aria-labelledby="h1">
          <div>
            <h1 id="h1">
              <span className="unmask">
                <span>Where the city</span>
              </span>
              <span className="unmask">
                <span>is eating now.</span>
              </span>
            </h1>
            <p className="lede">
              Covers reads live Blackbird check-ins and shows which rooms are filling
              up, neighborhood by neighborhood. Pick a city, then pick a table.
            </p>
          </div>
          {data && (
            <div className="ticker" aria-live="polite">
              <Ticker value={data.total} nonce={nonce} />
              <div className="lbl">Covers in this window</div>
              <div className="win">Last {Math.round(data.windowMinutes / 60)} hours</div>
            </div>
          )}
        </section>

        {!bundle && (
          <div className="statebox" role="status">
            <b>Can&apos;t reach Flynet right now.</b>
            <p>
              The board shows real check-ins only, so there is nothing to display
              until the feed answers. Nothing here is faked, ever.
            </p>
            <RetryButton />
          </div>
        )}

        {bundle && stale && (
          <div className="statebox" role="status">
            <b>Live feed unreachable.</b>
            <p>
              Showing data pulled {bundle.pulledLabel}. The numbers below are real,
              just not this minute&apos;s.
            </p>
            <RetryButton />
          </div>
        )}

        {data && (
          <>
            <nav className="rail" aria-label="Choose a city">
              {data.cities.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={i === cityIdx}
                  onClick={() => selectCity(i)}
                >
                  {cityLabel(c.name)}
                  <span className="c">{fmt(c.covers)}</span>
                </button>
              ))}
            </nav>

            <section className="board" aria-label="Live dining activity">
              {city ? (
                <Board city={city} nonce={nonce} />
              ) : (
                <div className="empty">
                  <b>Quiet right now.</b> No covers logged in the current window. Try
                  another city, or check back when the dinner rush starts.
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="close">
        <div className="wrap">
          <div className="letter">
            <p>
              This board is live. It breathes as people sit down. Every cover here is
              a real, verified check-in at a Blackbird restaurant, not a forecast or
              a guess.
            </p>
            <p className="sig">See you at the table.</p>
          </div>
          <div className="credit">
            <span>
              Live network data from{" "}
              <a href="https://flynet.org" target="_blank" rel="noopener">
                Flynet
              </a>
              , built on Blackbird.
            </span>
            <span suppressHydrationWarning>
              {bundle
                ? `Data pulled ${genAt(bundle.generatedAt)}`
                : "No live data yet."}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}

// Board: neighborhood sections for the selected city. Keyed by city name so a
// city switch re-runs the meter entrance, matching the approved preview.
function Board({ city, nonce }: { city: BundleCity; nonce: number }) {
  const maxHood = city.neighborhoods.reduce((m, h) => Math.max(m, h.covers), 0);
  return (
    <div key={`${city.name}-${nonce}`}>
      {city.neighborhoods.map((h) => {
        const pct = intensity(h.covers, maxHood);
        return (
          <section className="hood" key={h.name}>
            <div className="head">
              <div>
                <h2>{h.name}</h2>
                <div className="meta">{city.name}</div>
              </div>
              <div className="count">
                {fmt(h.covers)}
                <small>{coversWord(h.covers)}</small>
              </div>
            </div>
            <div
              className="meter"
              role="img"
              aria-label={`Activity ${pct} percent of the busiest neighborhood`}
            >
              <i style={{ width: `${pct}%` }} />
            </div>
            <div className="rows">
              {h.venues.map((v, i) => (
                <a
                  className={"row" + (v.visits >= 5 ? " hot" : "")}
                  key={`${h.name}-${v.name}-${i}`}
                  href="#"
                >
                  <span className="nm">
                    <span className="swatch" aria-hidden="true" />
                    {v.name}
                  </span>
                  <span className="cu">{v.cuisine}</span>
                  <span className="v">
                    <b>{v.visits}</b> {coversWord(v.visits)}
                    <RelativeTime iso={v.last ?? ""} initial={v.lastLabel} />
                  </span>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
