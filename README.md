# Covers

Covers shows which restaurants and neighborhoods are filling up right now, from live Blackbird check-ins. Pick a city, then pick a table.

Live at https://covers-pink.vercel.app

## How it works

- The server fetches the Flynet check-in feed (GET /flynet/v1/check_ins, three pages of 100) and aggregates real visits into cities, neighborhoods, and venues over a rolling four-hour window.
- Every count on the board is a real, verified Blackbird check-in. Nothing is forecast, modeled, or mocked.
- The Flynet API key is read server-side only, from FLYNET_API_KEY. It never reaches the browser.
- Responses are cached server-side for 45 seconds, so refreshes are gentle on the network.

## Where to look in the code

- lib/covers.ts: the data layer. Fetches, aggregates, and window-stamps the check-in feed. Returns the last good snapshot marked stale when the API is unreachable.
- app/page.tsx: the server-rendered board. Builds the serializable data bundle, including pre-computed relative-time labels so hydration never mismatches.
- components/PageShell.tsx: client interactivity. City switching, the cover-count ticker, and the live-state masthead.
- DESIGN.md: the approved design system. Every token, font, and motion decision traces to it.

## Honest states

- Stale: if the API stops answering, the board keeps the last good data and labels its age.
- Empty: a city with no covers in the window says so plainly, with a next action.
- Offline: if there has never been a successful fetch, the board says so and offers a retry.

## Run it locally

npm install
npm run dev

Requires FLYNET_API_KEY in .env.local. Get a key at make.flynet.org.

Powered by Flynet. Built on the Blackbird dining network.
