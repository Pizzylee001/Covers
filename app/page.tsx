import PageShell from "@/components/PageShell";
import { getSnapshot } from "@/lib/covers";

// Poll on request: the page renders server-side from live data on every
// request, with a 45s cache inside the data layer. No background loops.
export const dynamic = "force-dynamic";

export default async function Home() {
  const snapshot = await getSnapshot();
  return <PageShell snapshot={snapshot} />;
}
