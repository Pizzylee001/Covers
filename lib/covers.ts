// Data layer for Covers. Server-side only: the key lives in process.env.FLYNET_API_KEY.
// Fetches 3 pages of check-ins (page_size 100), aggregates into
// cities -> neighborhoods -> venues over a stated window (newest check-in
// timestamp minus 4 hours), returning the same shape as preview-data.json's
// data object. On API failure it returns a stale snapshot if one exists,
// otherwise null. It never throws into the page.
// Be gentle with the API: 45s server-side cache, fetch happens only on request.

const API_BASE = "https://api.blackbird.xyz/flynet/v1";
const PAGES = 3;
const PAGE_SIZE = 100;
const WINDOW_MINUTES = 240; // stated window: newest check-in timestamp minus 4 hours
const CACHE_MS = 45_000;
const FETCH_TIMEOUT_MS = 8_000;

export type Venue = { name: string; cuisine: string; visits: number; last: string | null };
export type Neighborhood = { name: string; covers: number; venues: Venue[] };
export type City = { name: string; covers: number; neighborhoods: Neighborhood[] };
export type CoversData = {
  generatedAt: string;
  windowMinutes: number;
  total: number;
  cities: City[];
};
export type Snapshot = {
  data: CoversData;
  fetchedAt: string; // ISO time of the fetch that produced this snapshot
  stale: boolean; // true when the feed could not be reached just now
};

type RawRecord = {
  id?: string;
  created_at?: string | null;
  location?: {
    id?: string;
    name?: string | null;
    restaurant?: { id?: string; name?: string | null; cuisine?: string[] | string | null } | null;
    neighborhood?: { name?: string | null; region?: string | null } | null;
    address?: { city?: string | null; state?: string | null } | null;
  } | null;
};

let cache: Snapshot | null = null;

async function fetchPage(page: number): Promise<RawRecord[]> {
  const res = await fetch(`${API_BASE}/check_ins?page=${page}&page_size=${PAGE_SIZE}`, {
    headers: {
      "X-API-Key": process.env.FLYNET_API_KEY ?? "",
      "User-Agent": "Covers/0.1 (live dining momentum board)",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`check_ins page ${page} returned ${res.status}`);
  const json = (await res.json()) as { check_ins?: RawRecord[] } | RawRecord[];
  const rows = Array.isArray(json) ? json : json.check_ins;
  return Array.isArray(rows) ? rows : [];
}

function pickTimestamp(r: RawRecord): number | null {
  const raw = r?.created_at;
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}

function venueName(r: RawRecord): string {
  // Restaurant names are sometimes empty on the list endpoint; fall back to
  // the location name. Never display an empty name as "Unknown".
  return (r.location?.restaurant?.name || r.location?.name || "").trim();
}

function cuisineLabel(r: RawRecord): string {
  const c = r.location?.restaurant?.cuisine;
  const first = Array.isArray(c) ? c[0] : typeof c === "string" ? c : "";
  return (first || "").trim() || "Restaurant";
}

function cityName(r: RawRecord): string {
  const region = (r.location?.neighborhood?.region || "").trim();
  if (region) return region;
  const city = (r.location?.address?.city || "").trim();
  const state = (r.location?.address?.state || "").trim();
  if (city) return state ? `${city}, ${state}` : city;
  return "Other";
}

function hoodName(r: RawRecord): string {
  return (r.location?.neighborhood?.name || "").trim() || "Other";
}

type VenueAgg = { key: string; name: string; cuisine: string; visits: number; last: number };
type HoodAgg = { name: string; venues: Map<string, VenueAgg> };
type CityAgg = { name: string; hoods: Map<string, HoodAgg> };

function aggregate(records: RawRecord[]): CoversData {
  const times = records.map(pickTimestamp).filter((t): t is number => t !== null);
  // Stated window: newest check-in timestamp minus 4 hours.
  const newest = times.length ? Math.max(...times) : Date.now();
  const cutoff = newest - WINDOW_MINUTES * 60_000;

  const cityMap = new Map<string, CityAgg>();
  for (const r of records) {
    const t = pickTimestamp(r);
    if (t === null || t < cutoff) continue;
    const name = venueName(r);
    if (!name) continue; // no usable venue name, skip the record
    const cn = cityName(r);
    const hn = hoodName(r);
    const city = cityMap.get(cn) ?? { name: cn, hoods: new Map<string, HoodAgg>() };
    cityMap.set(cn, city);
    const hood = city.hoods.get(hn) ?? { name: hn, venues: new Map<string, VenueAgg>() };
    city.hoods.set(hn, hood);
    const key = r.location?.restaurant?.id || r.location?.id || name;
    const venue =
      hood.venues.get(key) ?? { key, name, cuisine: cuisineLabel(r), visits: 0, last: t };
    venue.visits += 1;
    venue.last = Math.max(venue.last, t);
    hood.venues.set(key, venue);
  }

  const cities: City[] = [];
  let total = 0;
  for (const city of cityMap.values()) {
    const hoods: Neighborhood[] = [];
    for (const hood of city.hoods.values()) {
      const venues: Venue[] = [...hood.venues.values()]
        .sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name))
        .map((v) => ({
          name: v.name,
          cuisine: v.cuisine,
          visits: v.visits,
          last: new Date(v.last).toISOString(),
        }));
      if (!venues.length) continue;
      hoods.push({ name: hood.name, covers: venues.reduce((s, v) => s + v.visits, 0), venues });
    }
    if (!hoods.length) continue;
    hoods.sort((a, b) => b.covers - a.covers || a.name.localeCompare(b.name));
    const covers = hoods.reduce((s, h) => s + h.covers, 0);
    cities.push({ name: city.name, covers, neighborhoods: hoods });
    total += covers;
  }
  cities.sort((a, b) => b.covers - a.covers || a.name.localeCompare(b.name));

  return {
    generatedAt: new Date().toISOString(),
    windowMinutes: WINDOW_MINUTES,
    total,
    cities,
  };
}

export async function getSnapshot(): Promise<Snapshot | null> {
  if (!process.env.FLYNET_API_KEY) return null; // no key, no call, no crash
  const now = Date.now();
  if (cache && now - Date.parse(cache.fetchedAt) < CACHE_MS) return cache;
  try {
    const rows: RawRecord[] = [];
    for (let page = 1; page <= PAGES; page++) {
      const part = await fetchPage(page);
      rows.push(...part);
      if (part.length < PAGE_SIZE) break; // last page reached
    }
    if (!rows.length) throw new Error("check_ins returned no records");
    const snapshot: Snapshot = {
      data: aggregate(rows),
      fetchedAt: new Date().toISOString(),
      stale: false,
    };
    cache = snapshot;
    return snapshot;
  } catch {
    // API unreachable: serve the last good snapshot with an honest stale flag,
    // or null when nothing was ever fetched. Never throw into the page.
    if (cache) return { ...cache, stale: true };
    return null;
  }
}

