import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FarmProfile {
  display_name: string | null;
  phone: string | null;
  state: string | null;
  location: string | null;
  land_size: string | null;
  soil_type: string | null;
  irrigation: string | null;
  current_crop: string | null;
  crop_sown_date: string | null;
  farming_goal: string | null;
  language: string | null;
  onboarding_completed: boolean | null;
}

const FIELDS =
  'display_name, phone, state, location, land_size, soil_type, irrigation, current_crop, crop_sown_date, farming_goal, language, onboarding_completed';

const CACHE_KEY = 'gramai_farm_profile';
const CACHE_USER_KEY = 'gramai_farm_profile_user';

export function readCachedFarmProfile(userId?: string): FarmProfile | null {
  try {
    if (!userId || localStorage.getItem(CACHE_USER_KEY) !== userId) return null;
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as FarmProfile) : null;
  } catch {
    return null;
  }
}

/** Days since sowing, or null when we don't know the sowing date. */
export function cropAgeDays(profile: FarmProfile | null): number | null {
  if (!profile?.crop_sown_date) return null;
  const sown = new Date(profile.crop_sown_date).getTime();
  if (Number.isNaN(sown)) return null;
  return Math.max(0, Math.round((Date.now() - sown) / 86_400_000));
}

/** Compact, plain-text summary of the farm, shared by chat, voice and scan. */
export function farmContext(profile: FarmProfile | null): string | undefined {
  if (!profile) return undefined;
  const age = cropAgeDays(profile);
  const parts = [
    profile.display_name && `Farmer name: ${profile.display_name}`,
    (profile.location || profile.state) && `Location: ${[profile.location, profile.state].filter(Boolean).join(', ')}`,
    profile.land_size && `Land size: ${profile.land_size}`,
    profile.soil_type && `Soil: ${profile.soil_type}`,
    profile.irrigation && `Irrigation: ${profile.irrigation}`,
    profile.current_crop && `Current crop: ${profile.current_crop}`,
    age !== null && `Crop age: ${age} days since sowing`,
    profile.farming_goal && `Farming goal: ${profile.farming_goal}`,
  ].filter(Boolean);
  return parts.length ? parts.join('\n') : undefined;
}

export function useFarmProfile() {
  const [profile, setProfile] = useState<FarmProfile | null>(null);
  const loadRequestRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (requestId !== loadRequestRef.current) return;

      if (!user) {
        setUserId(null);
        setProfile(null);
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_USER_KEY);
        return;
      }

      setUserId(user.id);
      const cached = readCachedFarmProfile(user.id);
      setProfile(cached);

      const { data, error } = await supabase
        .from('profiles')
        .select(FIELDS)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (requestId !== loadRequestRef.current) return;

      const nextProfile = (data as FarmProfile | null) ?? null;
      setProfile(nextProfile);
      if (nextProfile) {
        try {
          localStorage.setItem(CACHE_USER_KEY, user.id);
          localStorage.setItem(CACHE_KEY, JSON.stringify(nextProfile));
        } catch { /* storage unavailable or full */ }
      } else {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_USER_KEY);
      }
    } catch (error) {
      if (requestId === loadRequestRef.current) {
        setUserId(null);
        setProfile(null);
        console.error('Failed to load farm profile:', error);
      }
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active) void load();
    };

    refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Defer Supabase queries until the auth callback has released its lock.
      window.setTimeout(refresh, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      loadRequestRef.current += 1;
    };
  }, [load]);

  const save = useCallback(async (values: Partial<FarmProfile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not signed in') };
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, ...values }, { onConflict: 'user_id' });
    if (!error) await load();
    return { error };
  }, [load]);

  return { profile, loading, userId, reload: load, save };
}
