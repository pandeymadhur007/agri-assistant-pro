import { useCallback, useEffect, useState } from 'react';
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

export function readCachedFarmProfile(): FarmProfile | null {
  try {
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
  const [profile, setProfile] = useState<FarmProfile | null>(() => readCachedFarmProfile());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUserId(null);
      setProfile(null);
      localStorage.removeItem(CACHE_KEY);
      setLoading(false);
      return;
    }
    setUserId(user.id);
    const { data } = await supabase.from('profiles').select(FIELDS).eq('user_id', user.id).maybeSingle();
    if (data) {
      setProfile(data as FarmProfile);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* storage full */ }
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

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
