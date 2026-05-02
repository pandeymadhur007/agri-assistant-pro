import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClimateAlert {
  id: string;
  user_id: string;
  alert_type: 'cold' | 'heatwave' | 'rain' | 'frost';
  severity: string | null;
  title: string;
  message: string;
  state: string | null;
  is_read: boolean | null;
  is_dismissed: boolean | null;
  triggered_at: string;
  created_at: string;
}

const LAST_GEN_KEY = 'gram-ai-alerts-last-gen';

interface WeatherSnapshot {
  tempMin: number;
  tempMax: number;
  rainProb: number;
  state: string | null;
}

function buildAlerts(w: WeatherSnapshot, language: string): Omit<ClimateAlert, 'id' | 'user_id' | 'is_read' | 'is_dismissed' | 'triggered_at' | 'created_at'>[] {
  const out: any[] = [];
  const isHi = language === 'hi';
  if (w.tempMin < 4) {
    out.push({
      alert_type: 'frost', severity: 'high', state: w.state,
      title: isHi ? 'पाला अलर्ट' : 'Frost warning',
      message: isHi ? 'कोमल फसलें ढकें, छोटे पौधों को बचाएं।' : 'Cover crops, protect young plants.',
    });
  } else if (w.tempMin < 10) {
    out.push({
      alert_type: 'cold', severity: 'medium', state: w.state,
      title: isHi ? 'ठंड का अलर्ट' : 'Cold-wave alert',
      message: isHi ? 'पशुओं को अंदर लाएं और गर्म रखें।' : 'Protect livestock — bring them inside and keep warm.',
    });
  }
  if (w.tempMax > 40) {
    out.push({
      alert_type: 'heatwave', severity: 'high', state: w.state,
      title: isHi ? 'लू (हीटवेव) अलर्ट' : 'Heatwave alert',
      message: isHi ? 'पशुओं और फसलों को अतिरिक्त पानी दें।' : 'Give extra water to animals and crops.',
    });
  }
  if (w.rainProb >= 70) {
    out.push({
      alert_type: 'rain', severity: 'medium', state: w.state,
      title: isHi ? 'भारी बारिश की संभावना' : 'Heavy rain forecast',
      message: isHi ? 'जल निकासी जांचें, पशु आश्रय सुरक्षित करें।' : 'Check drainage, secure animal shelter.',
    });
  }
  return out;
}

export function useClimateAlerts(language: string = 'en') {
  const [alerts, setAlerts] = useState<ClimateAlert[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userState, setUserState] = useState<string | null>(null);

  // Track auth + profile state
  useEffect(() => {
    const sync = async (uid: string | null) => {
      setUserId(uid);
      if (!uid) { setUserState(null); return; }
      const { data } = await supabase.from('profiles').select('state').eq('user_id', uid).maybeSingle();
      setUserState(data?.state ?? null);
    };
    supabase.auth.getSession().then(({ data }) => sync(data.session?.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => sync(s?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const fetchAlerts = useCallback(async () => {
    if (!userId) { setAlerts([]); return; }
    const { data } = await supabase
      .from('climate_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_dismissed', false)
      .order('triggered_at', { ascending: false })
      .limit(20);
    setAlerts((data ?? []) as ClimateAlert[]);
  }, [userId]);

  // Generate fresh alerts at most once per 6h based on weather
  const generateFromWeather = useCallback(async () => {
    if (!userId || !navigator.geolocation) return;
    const last = localStorage.getItem(LAST_GEN_KEY);
    if (last && Date.now() - Number(last) < 6 * 3600 * 1000) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&daily=temperature_2m_min,temperature_2m_max,precipitation_probability_max&forecast_days=2&timezone=auto`
        );
        const j = await r.json();
        const snap: WeatherSnapshot = {
          tempMin: j.daily?.temperature_2m_min?.[0] ?? 20,
          tempMax: j.daily?.temperature_2m_max?.[0] ?? 30,
          rainProb: j.daily?.precipitation_probability_max?.[0] ?? 0,
          state: userState,
        };
        const fresh = buildAlerts(snap, language);
        if (fresh.length === 0) { localStorage.setItem(LAST_GEN_KEY, String(Date.now())); return; }

        // Avoid duplicates of same-type alert in last 6h
        const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
        const { data: recent } = await supabase
          .from('climate_alerts')
          .select('alert_type')
          .eq('user_id', userId)
          .gte('triggered_at', since);
        const existing = new Set((recent ?? []).map((r: any) => r.alert_type));
        const toInsert = fresh
          .filter(a => !existing.has(a.alert_type))
          .map(a => ({ ...a, user_id: userId }));
        if (toInsert.length) {
          await supabase.from('climate_alerts').insert(toInsert);
          // fire browser notifications if permitted
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            toInsert.forEach(a => {
              try { new Notification(a.title, { body: a.message, icon: '/icon-192.png' }); } catch {}
            });
          }
        }
        localStorage.setItem(LAST_GEN_KEY, String(Date.now()));
        fetchAlerts();
      } catch (e) {
        console.error('alert generation error', e);
      }
    } catch {
      /* geolocation unavailable or denied — silent */
    }
  }, [userId, userState, language, fetchAlerts]);

  useEffect(() => {
    fetchAlerts();
    if (userId) generateFromWeather();
  }, [userId, fetchAlerts, generateFromWeather]);

  const markRead = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase.from('climate_alerts').update({ is_read: true }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  }, [userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabase.from('climate_alerts').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  }, [userId]);

  const dismiss = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase.from('climate_alerts').update({ is_dismissed: true }).eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, [userId]);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return { alerts, unreadCount, markRead, markAllRead, dismiss, refresh: fetchAlerts };
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}
