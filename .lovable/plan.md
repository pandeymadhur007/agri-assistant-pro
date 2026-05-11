## Goal
Polish Gram AI to feel like a premium product (Arc / Linear / Raycast / Notion vibe). No feature, route, or layout structure changes — only visual tokens, components, typography, spacing, and motion.

## What changes

### 1. Design tokens (`src/index.css` + `tailwind.config.ts`)
Replace the current green/yellow palette with the calmer one from the brief:

- `--background` → `#F7F6F2` (warm off-white)
- `--foreground` → `#1E2421`
- `--primary` → `#3F6B52` (deep sage)
- `--secondary` → `#A8C3A0`
- `--accent` → `#C7D96A`
- `--card` → `#FFFFFF`
- `--border` → `#E7E6E0` (hairline)
- `--muted` → `#F0EFE9`
- `--muted-foreground` → `#6B716C`
- `--ring` → primary at low alpha
- `--radius` → `1rem` (consistent rounded corners)

Dark mode: near-black `#10120F` background, warm white text, primary lifted to `#7FB494`, hairline border `rgba(255,255,255,0.07)`.

Add new tokens: `--shadow-sm/md/lg` with soft, low-spread elevations (`0 1px 2px / 0 8px 24px -12px`), `--gradient-soft` (very subtle sage wash for hero only).

Remove the loud `pulse-glow`, neon `hero-pattern`, and bright gradient text. Replace gradient text with solid `text-foreground` + tracking adjustments.

### 2. Typography
Swap DM Sans for **Satoshi** (via Fontshare CDN) as primary, with system fallback. Use General Sans only if Satoshi fails. Set:

- Headings: Satoshi 600/700, tighter tracking (-0.02em on h1/h2)
- Body: Satoshi 400/500, 1.6 line-height
- Mono numerals on prices/temps/stats via `font-feature-settings: "tnum"`

Update `tailwind.config.ts` font weights and add `fontFamily.sans = ['Satoshi', 'system-ui', ...]`.

### 3. Logo / branding (`Navbar.tsx`)
Replace the "G" tile with a minimal SVG mark: a sage-green rounded square (radius 10) containing a single stylized leaf stroke in `--accent`. Wordmark "Gram AI" in Satoshi 600, tighter tracking, no gradient. Slightly smaller (h-9 w-9). Apply same mark to favicon (skip favicon swap unless trivial).

### 4. Shared components polish
- **Card** (`src/components/ui/card.tsx`): bump radius to `rounded-2xl`, hairline border, `shadow-sm`, `bg-card`, remove heavy gradients. Add a `.card-hover` utility: `transition-all duration-300, hover:-translate-y-0.5, hover:shadow-md`.
- **Button** (`src/components/ui/button.tsx`): default variant uses solid primary with subtle inner highlight; outline uses hairline border + hover bg-muted; ghost cleaner; sizes get more horizontal padding; remove harsh focus rings, use 2px ring at primary/30.
- **Input / Textarea**: hairline border, `bg-card`, focus ring soft.
- **Badge**: pill, lighter weight, muted bg variants.
- **Navbar**: thinner (h-14), backdrop blur stays, hairline bottom border, simpler icon buttons (ghost not outline-circle).
- **BottomNav**: floating pill with hairline border + soft shadow, active item gets sage pill background instead of bold color jump.

### 5. Page-level polish (no structural changes)
- `Index.tsx`: tighter hero spacing, replace `hero-gradient` with subtle `--gradient-soft`, larger heading (text-4xl/5xl), quieter subtitle, quick-action grid uses new card style.
- `MarketPrices`, `Weather`, `CropCenter`, `Chat`, `Community`, `Calendar`, `ScanResult`: only touch container spacing (`space-y-6`, `py-8`), card classes, button variants, heading sizes. No JSX structure rewrites beyond className edits.
- Replace inline `bg-green-*`, `text-white`, hard-coded hex with semantic tokens wherever encountered during the pass.

### 6. Animations
Keep framer-motion `PageTransition`. Add Tailwind keyframes already present (`fade-in`) and add `slide-up` (translateY(8px) → 0, 300ms). Use these on hero text + first card row. Remove `pulse-glow` usage. Keep AI typing dot animation. No spinners replaced — just ensure loaders use a soft pulsing skeleton (`bg-muted animate-pulse`).

### 7. Out of scope
- No route changes, no removed features, no new pages.
- No backend / edge function changes.
- No light/dark logic changes (theme toggle stays).
- No copy rewrites.

## Risks
- Satoshi via Fontshare adds ~40KB; acceptable for premium feel.
- Token swap will visually shift every page; acceptance criterion is "looks calmer + more consistent", not pixel-perfect to the brief mockup.
- Some pages use hard-coded color classes (e.g. `bg-green-600`); I'll sweep the most visible ones (Index, Navbar, BottomNav, Market/Weather/Chat/Scan) but minor leftovers may remain — easy follow-ups.

## Verification
- Build passes.
- Spot-check Home, Chat, Market Prices, Scan Result, Community in preview at current viewport. Confirm: new font loaded, sage palette applied, cards feel lighter, no neon green, bottom nav floats cleanly.
