import PageShell, { type PageBundle } from "@/components/PageShell";
import { getSnapshot } from "@/lib/covers";
import { relTime } from "@/lib/time";

// Poll on request: the page renders server-side from live data on every
// request, with a 45s cache inside the data layer. No background loops.
export const dynamic = "force-dynamic";

export default async function Home() {
  const snapshot = await getSnapshot();
  if (!snapshot) return <PageShell bundle={null} />;

  // All relative-time labels are computed here, on the server, exactly once.
  // The client hydrates from these serialized strings, so its first render
  // matches the server HTML and no clock-skew mismatch can occur.
  const bundle: PageBundle = {
    stale: snapshot.stale,
    generatedAt: snapshot.data.generatedAt,
    windowMinutes: snapshot.data.windowMinutes,
    total: snapshot.data.total,
    fetchedAt: snapshot.fetchedAt,
    pulledLabel: relTime(snapshot.fetchedAt),
    cities: snapshot.data.cities.map((c) => ({
      name: c.name,
      covers: c.covers,
      neighborhoods: c.neighborhoods.map((h) => ({
        name: h.name,
        covers: h.covers,
        venues: h.venues.map((v) => ({
          name: v.name,
          cuisine: v.cuisine,
          visits: v.visits,
          last: v.last,
          lastLabel: relTime(v.last),
        })),
      })),
    })),
  };
  return <PageShell bundle={bundle} />;
}
