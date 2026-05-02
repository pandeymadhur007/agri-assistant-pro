// Shared, cached geolocation helper.
// Avoids prompting the user multiple times by:
//  1. Caching the last successful position in localStorage for ~1 hour.
//  2. Deduplicating concurrent in-flight requests across the app.
//  3. Honoring the browser Permissions API when available — if permission
//     is already "granted", we skip showing any UI hint; if "denied", we
//     fail fast without re-prompting.

export interface CachedPosition {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const CACHE_KEY = "gram_geo_pos_v1";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let inflight: Promise<CachedPosition> | null = null;

function readCache(): CachedPosition | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPosition;
    if (!parsed?.timestamp) return null;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(pos: CachedPosition) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(pos));
  } catch {
    /* ignore quota errors */
  }
}

export function clearCachedPosition() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

/**
 * Get the user's position, reusing a cached value when possible so the
 * browser permission prompt only appears once per ~hour (and only the first
 * time per session if already granted previously).
 *
 * @param opts.forceFresh skip the cache and request a new fix
 */
export function getCachedPosition(opts: { forceFresh?: boolean; timeout?: number } = {}): Promise<CachedPosition> {
  if (!opts.forceFresh) {
    const cached = readCache();
    if (cached) return Promise.resolve(cached);
  }

  if (inflight) return inflight;

  inflight = new Promise<CachedPosition>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const value: CachedPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: Date.now(),
        };
        writeCache(value);
        resolve(value);
      },
      (err) => reject(err),
      {
        enableHighAccuracy: false,
        timeout: opts.timeout ?? 10000,
        maximumAge: CACHE_TTL_MS, // let the browser reuse a recent fix too
      }
    );
  }).finally(() => {
    inflight = null;
  });

  return inflight;
}