# DESIGN.md, Covers

Status: APPROVED by Lee, 2026-09-19, based on the rendered preview (`preview.html` plus desktop and mobile screenshots). This document is the single source of truth for every visual decision in Covers. The coding AI must reproduce the approved preview's look and behavior, not reinterpret it.

Design read: a live dining-momentum app for Blackbird diners deciding where to eat tonight, with a warm, alive language, leaning toward Vibrant & Block-based with editorial structure.

Surface mode: Operate, task-led. No marketing landing pattern. Structure follows the task: choose a city, then choose a table.

Reference: `preview.html` in the project root is the approved rendered evidence. Data in it is real (pulled from the Flynet production API). The production app must keep this exact visual language while reading live data instead of the inlined snapshot.

## 1. Visual theme and atmosphere

- Mood: warm, appetizing, alive. A live instrument for tonight's dining, not a corporate dashboard and not a food-tech gimmick.
- Philosophy: activity is the content. Amber-to-ember color encodes real activity intensity from real check-in counts. Nothing decorative pretends to be data.
- Background: bone canvas `#F3EEE2` with a faint dot grid (26px, `rgba(15,36,27,.10)` dots) as a street-grid texture, plus one soft amber radial glow top-right marking the live zone. Dot grid and glow are functional atmosphere, not pattern wallpaper.
- Density: standard (DIAL 5). Spacing generous at section level, tight within venue rows.
- No soft-shadow cards. Hierarchy comes from bleed dividers, type scale, and background tints. One functional glow exception: the live indicator pulse.
- Theme: light only for launch. (Parked: warm dark remap if Lee asks later.)

## 2. Color palette and roles

All values verified for contrast on `#F3EEE2` background.

| Token | Hex | Role | Contrast on bone |
|---|---|---|---|
| `--bone` | `#F3EEE2` | page background, canvas | base |
| `--paper` | `#FBF8F1` | raised surface, if needed | base |
| `--ink` | `#0F241B` | primary text | 14.08:1 AA |
| `--pine` | `#16352A` | headings, active fills, primary data | 11.5:1 AA |
| `--moss` | `#2C5741` | quiet venue swatch, secondary fills | decorative |
| `--sage` | `#55645A` | secondary text, captions, lede | 5.4:1 AA |
| `--amber` | `#8F570E` | activity numbers, data accent, focus ring | 5.13:1 AA |
| `--amber-fill` | `#D98A2B` | meter gradient start (fills only, never text) | decorative |
| `--ember` | `#B23A14` | live dot, hot-venue swatch, meter end | 5.17:1 AA |
| `--line` | `rgba(15,36,27,.14)` | hairline row borders | |
| `--line-strong` | `rgba(15,36,27,.28)` | section dividers, chip borders | |

One accent rule: amber/ember encode activity intensity only. Ember is never a button color. The only oversized solid is pine.

## 3. Typography

| Role | Font | Weight | Size | Notes |
|---|---|---|---|---|
| Display / hero / headings | Syne | 800 (700 for h2) | clamp(2.4rem,5.2vw,4.1rem) hero; clamp(1.5rem,3.4vw,2.15rem) h2 | tracking -0.035em to -0.03em, uppercase wordmark only |
| Body / UI | Manrope | 400/600 | 16px base | line-height 1.5 |
| Data figures / labels | system mono stack (`ui-monospace, SF Mono, Menlo, Consolas`) | 400/600 | 11-13px | uppercase labels, tabular-nums on all counts |

Production font load (Next.js): `next/font/google` for Syne weights 700 and 800 and Manrope weights 400, 500, 600, 700. Never a `<link>` tag in production.

## 4. Component stylings

- **Masthead (N6):** sticky, translucent bone with blur, 66px, wordmark (Syne 800 uppercase with rotated-quarter-circle mark), live indicator (pulsing ember dot + "Live"), "Powered by Flynet" credit link.
- **City rail chips:** pill buttons, 1px `--line-strong` border, transparent fill; active = pine fill, bone text. Min 40px height. Count in mono.
- **Hero:** hanging asymmetric grid (1.35fr / 1fr). Type-unmask entrance (two lines rise from overflow clip). Right column: giant ticker number (Syne 800, tabular-nums) with mono label and window note.
- **Neighborhood sections:** bleed 2px `--line-strong` top border, hanging h2, activity meter (5px bar, amber-to-ember gradient, scaleX entrance), cover count in amber.
- **Venue rows:** hairline-separated table-like rows (no cards). Swatch dot (moss, or ember when 5+ covers), name (Manrope 600), cuisine (sage), right-aligned mono cover count plus relative time. Hover: subtle tint + 6px padding-left nudge. Rows are real links.
- **Empty state:** specific and cause-labeled ("Quiet right now. No covers logged in this city in the current window."), same visual language as populated state, with a next action (try another city).
- **Loading:** reserve space, skeleton tint on rows. **Error:** pine-tinted inline notice with retry action, no generic blank panel.
- **States floor:** hover, focus-visible (3px amber ring, offset 2), active, disabled, loading, error, empty on every interactive component. Touch targets 44px minimum, 8px spacing.

## 5. Layout principles

- Container max 1180px, 24px side padding.
- Spacing scale 4/8: 4, 8, 13, 18, 22, 34, 54.
- Hero grid collapses to single column under 820px; ticker moves to full-width left-aligned block with top border.
- Neighborhood head collapses to single column under 820px.
- Venue rows: two columns + wrapped cuisine on mobile.
- No horizontal scroll at any width. `min-h-[100dvh]` semantics, never `h-screen`.

## 6. Depth and elevation

- No drop shadows in this system. Surfaces separate by background tint, hairlines, and bleed dividers.
- Only elevation exceptions, both functional: live-dot pulse ring, backdrop blur on the sticky masthead.
- Radius system: blocks 14px, controls 9px, chips full-pill. One shape lock, no mixing outside this table.

## 7. Do's and don'ts

- DON'T add shadowed cards, nested cards, or rounded panel grids (anti-reference).
- DON'T add gradient text, glass decoration, or a second accent color.
- DON'T use emojis as icons; icons come from Lucide as inline SVG, one stroke weight, or no icons at all.
- DON'T invent metrics, venues, or counts; every number on screen is real Flynet data.
- DON'T use Inter, cobalt, cream+brass, or the prior projects' systems (see project LEDGER for rotation basis).
- DON'T put "Blackbird" or "Flynet" in the product name, package, domain, or handles. Credit with "Powered by Flynet" text linking to `https://flynet.org`. Blackbird logo, if ever used, must link to `blackbird.xyz` and never be recolored (Flynet brand rules).
- DON'T mock data for the demo: the app must show the live feed or its honest stale/empty state.
- DO keep tabular-nums on every count, expose keyboard focus, respect prefers-reduced-motion (all motion falls back to static final state).
- DO keep copy plain and active: "Pick a city, then pick a table."

## 8. Responsive behavior

- Breakpoints: 375, 768 (collapse hero/rows), 820 (hero and head collapse), 1024 (nav one-line), 1440.
- Mobile-first build order. All asymmetric layouts collapse to strict single column below 768px.
- Verified at 390px and 1280px in the approved preview.

## 9. Signature, motion and depth

- Signature: the Number Ticker, the live network cover count that counts up on load and updates as data refreshes. Job: the product is a live count, so the count must visibly tick. (Magic UI Number Ticker family.)
- Motion plan, standard tier:
  - Entrance: hero type-unmask (two lines, 0.9s, staggered 80ms); ticker count-up.
  - State: meter bars grow scaleX once on render; city switch re-renders meters and ticker.
  - Hover: row background tint + padding nudge, 180ms cubic-bezier(0.16,1,0.3,1).
  - Live: pulsing ember dot, 2.4s loop.
- All motion is transform/opacity only, interruptible, and reduced-motion collapses everything to static final state.
- Refresh plan: data refreshes on a poll (target 30-60s server-side). Ticker and meters update in place; no layout shift.

## Data honesty rules (binding for the build)

- Every displayed count derives from real check-ins in a stated, labeled window.
- Stale data shows a stale label with the age, never pretend freshness.
- Venue names come from check-in records (restaurant names are sometimes empty on the list endpoint; never display an empty name as "Unknown" without cause).
- Sample data may exist only as a clearly labeled offline fallback used when the API is unreachable.
