## What's wrong today

**Market prices** — `supabase/functions/fetch-market-prices/index.ts` asks Gemini to *invent* "realistic" mandi prices inside hardcoded ranges (Rice 1500–4500/quintal). That's why your app shows Rice at ₹3,100 while search engines quote much higher figures. The project already has `DATA_GOV_API_KEY` configured but it's unused.

Note on the Brave screenshot: ₹99/kg = ₹9,900/quintal is a retail figure, not a mandi (wholesale) price. Real paddy mandi prices on Agmarknet are typically ₹2,000–3,500/quintal. So we shouldn't blindly chase ₹9,900 — we should fetch the *actual* government Agmarknet feed and show real numbers with the real date.

**Logo** — currently using `src/assets/gram-ai-logo.png`. You want the small green leaf/sprout icon from `Screenshot_2026-06-03_083610.png`.

## Plan

### 1. Real mandi prices from data.gov.in (Agmarknet)

Rewrite `supabase/functions/fetch-market-prices/index.ts` to call the official Agmarknet resource:

```text
https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
  ?api-key=$DATA_GOV_API_KEY&format=json&limit=2000
```

For each record map: `commodity → crop_name`, `state`, `district`, `market → mandi`, `modal_price → price` (₹/quintal), `arrival_date → price_date`. Compute `price_trend` by comparing the new modal price for the same `(crop, state, mandi)` against the previous row in `market_prices` (up / down / stable, threshold ±2%).

Then: filter to the crop list the app already shows, delete old rows, insert in batches of 100. Keep the existing response shape (`{ success, count, updated_at }`) so `MarketPrices.tsx` and `MarketPriceCrop.tsx` need no client changes.

Fallback: if the API call fails or returns 0 rows, return `{ error: "Live mandi feed unavailable" }` with status 503 — do NOT fall back to AI-invented numbers. The UI's existing error state will surface this honestly.

Keep the AI-based `market-insight` edge function as-is; it just summarizes whatever real prices are in the DB.

### 2. Replace logo

- Upload `Screenshot_2026-06-03_083610.png` via `lovable-assets create` → `src/assets/gram-ai-logo-v2.png.asset.json`.
- Update the one import in `src/components/Navbar.tsx` to point at the new asset.
- Delete the old asset pointer + CDN file via `delete_asset`.

(The screenshot is a tight crop of just the icon, so it'll work directly as the header logo. Favicon and PWA icons are separate files and stay untouched unless you want those swapped too — see open question below.)

## Open questions

1. Do you also want the **favicon** (`public/favicon.svg`) and the manifest icons updated to the new leaf icon, or just the in-app header logo?
2. The data.gov.in feed lists hundreds of mandis but not every crop is reported every day. If a crop in your app has zero rows for today, should the page show "No price reported today" or fall back to the **most recent** mandi price for that crop (with the older date shown)?
