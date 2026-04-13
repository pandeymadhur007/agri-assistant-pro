

## Plan: Fix Navbar, Improve Language Switching, and Fix Market Price Data

### Changes Overview

**1. Simplify Navbar — Remove nav links, keep only Home + Language**

Strip out assistant, market-prices, calendar, community, schemes links. Keep only:
- Logo/Home link (left side)
- Prominent language selector (right side) — make it more visible with larger button, flag-style display showing current language name prominently, always visible (not hidden on mobile)

**2. Make Language Selector More Prominent**

Instead of a small outline button with hidden text on mobile:
- Always show the current language native name (even on mobile)
- Use a more visible styling (primary outline, larger text)
- Add a label like "भाषा / Language" to make it obvious

**3. Fix Sugarcane Price Data in Edge Function**

The AI prompt currently lists `Sugarcane` with no specific price guidance. Sugarcane in India is priced differently — it's measured per quintal but has FRP (Fair & Remunerative Price) around ₹315/quintal set by government, and market prices range ₹280-400/quintal. The current prompt says generic ranges. Will add explicit sugarcane pricing: `Sugarcane 280-400` to the prompt to ensure accuracy.

Also will add validation in the edge function to reject obviously wrong prices (e.g., sugarcane shouldn't be ₹5000/quintal).

### Technical Details

**Files to modify:**

1. **`src/components/Navbar.tsx`** — Remove all navItems except Home. Redesign language selector to be larger and always-visible with native language name shown on all screen sizes.

2. **`supabase/functions/fetch-market-prices/index.ts`** — Update AI prompt with accurate sugarcane price range (₹280-400/quintal based on FRP), add price validation to reject outliers, and improve prompt specificity for all crops.

### Estimated scope: 2 files modified

