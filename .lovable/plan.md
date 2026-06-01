## What I'll change

### 1. Font: switch site-wide to "Basic"
You said you'll upload the `.woff2`/`.ttf` files. I'll:
- Place them in `public/fonts/basic/` (e.g. `Basic-Regular.woff2`, `Basic-Medium.woff2`, `Basic-Bold.woff2`).
- Add an `@font-face` block in `src/index.css` with `font-display: swap`.
- Update `tailwind.config.ts` to make `font-sans` = `Basic, system-ui, sans-serif`, so every page/component picks it up automatically.
- Preload the Regular weight in `index.html` for a snappy first paint.

**I need from you:** the actual font files. Drag them into chat (Regular + Medium/Bold ideally). If you can't share them, say the word and I'll swap to the closest free match (Manrope) instead.

### 2. Scanning: make it fast and feel fast
You picked all four improvements. I'll implement them in this order:

**a. Aggressive client-side compression → WebP**
- `src/hooks/useCropScan.ts` currently caps at 1024px @ JPEG 0.78. Drop to **768px @ WebP 0.72** with a JPEG fallback for old browsers. Typical payload goes from ~250 KB → ~60–90 KB (3–4× smaller upload).

**b. Switch model to `google/gemini-2.5-flash-lite`**
- In `supabase/functions/scan-crop/index.ts`, change the model. It's measurably faster and cheaper. Disease detection on clear leaf photos stays solid; I'll keep the same strict JSON system prompt so accuracy doesn't drift.

**c. Upload via Lovable Cloud Storage instead of base64**
- New public bucket `crop-scan-uploads` (RLS: anyone can `INSERT`, signed URLs for read, auto-cleanup after 24h via a scheduled function).
- Client uploads the compressed WebP directly → gets a public URL → POSTs only the URL to `scan-crop`. The edge function passes that URL to Gemini (it accepts URLs in `image_url`). Removes the heavy base64 round-trip and lets the upload happen in parallel with UI prep.
- DB column `image_url` keeps the real signed URL now (instead of the truncated base64 reference).

**d. Streaming progress + optimistic UI on the Scan page**
- Three visible stages with a smooth progress bar: **Compressing → Uploading → Analyzing**.
- Skeleton result card appears the instant analysis starts.
- Cancellable via `AbortController`.

**Expected end-to-end time:** ~7–10s today → **~2–4s** on a normal 4G connection.

### 3. New logo + icon set (minimal premium AI aesthetic)
Style brief: geometric monoline, soft rounded edges, single subtle green accent (`#7FAE8D`), Scandinavian/futuristic, no gradients-on-gradients.

- **Logo:** generate a new mark via `imagegen` — abstract sprout-meets-circuit geometry, single-weight stroke, premium feel. Output as transparent PNG at `src/assets/logo.png` + an SVG-style monochrome variant for the navbar. Replace usage in `Navbar.tsx` and favicon.
- **Quick Action icons:** replace the current Lucide icons (which feel templatey) with a custom monoline set generated to match — one per action (Chat, Crop Center, Animal Husbandry, Smart Crops, Market Prices, Calendar, Community, Weather, Government Schemes). Stored as individual transparent PNGs in `src/assets/icons/`.
- The icon container in `AnimatedCard`/`QuickActionCard` becomes a soft tinted square with the new icon centered, plus a quiet hover lift and a one-time entrance shimmer to add curiosity.

### 4. Quick Actions: centered pyramid layout
Current grid is `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` — stretches edge-to-edge. New layout on `src/pages/Index.tsx` (desktop only; mobile stays a clean 2-col stack for usability):

```text
[ • ] [ • ] [ • ] [ • ]      ← row 1: 4 cards
   [ • ] [ • ] [ • ]         ← row 2: 3 cards
      [ • ] [ • ]            ← row 3: 2 cards
```

- 9 actions → 4 + 3 + 2 fits perfectly.
- Implemented as three flex rows wrapped in a `max-w-5xl mx-auto` container so the whole pyramid stays centered on the page regardless of viewport width.
- Equal gap (`gap-5`), equal card width (`w-44`), staggered entrance animation from top row down for a satisfying reveal.
- Mobile fallback: standard 2-column grid (pyramids don't read well on narrow screens).

### 5. Small polish that comes along
- Card hover gets a slight scale + soft green glow on the icon only (curiosity hook).
- "Quick Actions" heading gets a refined kicker line ("Explore →") to invite tapping.

## Files I'll touch
- `src/index.css` — `@font-face` + font var
- `tailwind.config.ts` — sans font stack
- `index.html` — preload font, new favicon
- `src/hooks/useCropScan.ts` — WebP compression + storage upload + progress callbacks
- `src/pages/Scan.tsx` — streaming progress UI + skeleton
- `supabase/functions/scan-crop/index.ts` — model swap + accept URL input
- New migration — `crop-scan-uploads` bucket + RLS + cleanup function
- `src/pages/Index.tsx` — pyramid layout
- `src/components/AnimatedCard.tsx` / `QuickActionCard.tsx` — new icon container styling
- `src/components/Navbar.tsx` — new logo
- `src/assets/logo.png` + `src/assets/icons/*.png` — generated assets
- `public/fonts/basic/*` — your uploaded font files

## What I need from you to start
1. **Font files** for "Basic" (or say "use Manrope" and I'll proceed without).
2. Confirm the pyramid is **4-3-2** for the 9 quick actions (or tell me a different split).

Reply with the fonts attached and I'll build everything in one pass.