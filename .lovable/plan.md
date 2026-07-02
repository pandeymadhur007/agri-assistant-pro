# Gram AI — Reference-Matched UI Redesign

Goal: restyle the app to match the 4 uploaded reference screenshots (2 dark + 2 light) exactly — same palette, tile treatments, spacing, and typography — without changing any feature, route, or backend logic.

## Visual spec (locked to references)

**Light theme**
- Background: soft white → very light sage vertical wash (`#F7FAF7 → #EEF3EE`)
- Tiles: pure white `#FFFFFF` with hairline border `#E6ECE7`, radius `20px`, soft shadow
- Accent tiles use gradients:
  - Crop Center: deep navy→teal `#1E3A5F → #2F5F6E`
  - Smart Crop Planner: teal→sage `#2F5F6E → #6FA88C`
  - Market Prices: navy→sage `#1E3A5F → #6FA88C`
  - Community: mint→sky wash `#DCEBE1 → #E4EEF6`
- Icons/text on light tiles: dark navy `#0F1E2E`; on gradient tiles: white

**Dark theme**
- Background: near-black `#0B0F0D` with faint sage vignette
- Tiles: `#131A17` with hairline border `#1F2A24`, radius `20px`, subtle inner highlight
- Same accent gradients but with a soft outer glow (`box-shadow: 0 0 32px rgba(74,222,128,0.12)`)
- Text: `#E8EFEA` primary, `#8A968F` secondary

**Typography**
- Headings: **Fraunces** (or **Instrument Serif**) — matches the elegant "Quick Actions" heading in refs
- Body / UI: **Inter Tight** at weight 500–600 for tiles, 400 for descriptions
- Load via Google Fonts in `index.html`

## Layout (matches references)

- Quick Actions grid: **4 × 2** on desktop, **2 × 4** on mobile, generous 20px gaps
- Tile: centered icon (thin monoline, 1.5 stroke) + label below; no description on gradient tiles, small "EXPLORE →" only on Government Schemes
- "How It Works": 3 numbered circles in a row, STEP label + title (keep as in ref image)
- Feature highlight cards below (AI Crop Doctor / Mandi Prices / Smart Weather) with monoline illustrations — already close, will restyle borders + spacing to match

## Files to change (UI only)

1. `src/index.css` — palette tokens, background wash, tile utilities (`tile-primary`, `tile-secondary`, `tile-neutral`, `tile-schemes`, `tile-community`), shadow + border tokens for both themes
2. `tailwind.config.ts` — swap font family to Fraunces (display) + Inter Tight (sans)
3. `index.html` — Google Fonts link for Fraunces + Inter Tight
4. `src/pages/Index.tsx` — restore "STEP" label in How It Works, tighten tile markup to match ref (icon-only + label, no per-tile description on gradient tiles), 4-col grid
5. `src/components/Navbar.tsx` — match slim header from ref (logo left, theme + bell + language + avatar right)
6. `src/components/ui/card.tsx` + `button.tsx` — radius + border tuning to `rounded-[20px]`

## Functionality verification (no code changes, just checks)

After the redesign lands, I'll drive the running preview with Playwright to verify:
- Home loads, all 8 quick action tiles route correctly
- Chat sends + receives a reply
- Scan uploads a compressed image and returns a result
- Market Prices loads live Agmarknet rows
- Weather widget renders current conditions
- Theme toggle swaps light ↔ dark cleanly
- Language selector switches strings

Any breakage found → fix in the same pass.

## Out of scope

- No feature additions, no route changes, no backend/edge-function edits, no schema changes.
- Farming Tools and Crop Transportation sections (mentioned earlier) are NOT included here — separate task.

## Confirm before I build

- Font pick: **Fraunces + Inter Tight** (elegant serif display + modern sans body). Reply "use X" if you want a different pair (e.g. Instrument Serif, Satoshi, General Sans).
- OK to drop per-tile descriptions on the 4 gradient tiles to match the reference exactly? (Neutral white tiles keep just the label too, per ref.)
