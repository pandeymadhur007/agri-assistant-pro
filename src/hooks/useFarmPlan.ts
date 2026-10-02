import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCachedPosition } from '@/lib/geolocation';
import type { FarmProfile } from '@/hooks/useFarmProfile';

export interface FarmWeather {
  temperature: number;
  maxTemperature: number;
  minTemperature: number;
  rainProbability: number;
  windSpeed: number;
}

export interface FarmReminder {
  id: string;
  reminder_date: string;
  reminder_type: string | null;
  message: string | null;
  crop_name: string;
  is_completed: boolean | null;
}

export interface FarmPlanItem {
  title: string;
  detail: string;
  tone: 'primary' | 'weather' | 'warning' | 'neutral';
}

function stageForAge(age: number | null) {
  if (age === null) return 'planning';
  if (age <= 14) return 'establishment';
  if (age <= 40) return 'vegetative growth';
  if (age <= 70) return 'flowering and fruiting';
  return 'maturity and harvest preparation';
}

export function useFarmPlan(profile: FarmProfile | null, userId: string | null, age: number | null, isHi: boolean) {
  const [weather, setWeather] = useState<FarmWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [reminders, setReminders] = useState<FarmReminder[]>([]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);
    const loadWeather = async () => {
      try {
        const position = await getCachedPosition({ timeout: 7000 });
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${position.latitude}&longitude=${position.longitude}&current=temperature_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=2&timezone=auto`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error('Weather unavailable');
        const data = await response.json();
        if (!active) return;
        const currentTemperature = data.current?.temperature_2m;
        const maxTemperature = data.daily?.temperature_2m_max?.[0];
        const minTemperature = data.daily?.temperature_2m_min?.[0];
        const rainProbability = data.daily?.precipitation_probability_max?.[0];
        const windSpeed = data.current?.wind_speed_10m;
        if (![maxTemperature, minTemperature, rainProbability, windSpeed].every(Number.isFinite)) {
          throw new Error('Weather response is incomplete');
        }
        setWeather({
          temperature: Number.isFinite(currentTemperature) ? Math.round(currentTemperature) : Math.round(maxTemperature),
          maxTemperature: Math.round(maxTemperature),
          minTemperature: Math.round(minTemperature),
          rainProbability: Math.round(rainProbability),
          windSpeed: Math.round(windSpeed),
        });
      } catch {
        if (active) setWeather(null);
      } finally {
        if (active) setWeatherLoading(false);
      }
    };
    void loadWeather();
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setReminders([]);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    void supabase
      .from('user_reminders')
      .select('id, reminder_date, reminder_type, message, crop_name, is_completed')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .gte('reminder_date', today)
      .order('reminder_date', { ascending: true })
      .limit(5)
      .then(({ data }) => setReminders((data ?? []) as FarmReminder[]));
  }, [userId]);

  const plan = useMemo(() => {
    const crop = profile?.current_crop || (isHi ? 'आपकी फसल' : 'your crop');
    const stage = stageForAge(age);
    const rain = weather?.rainProbability ?? 0;
    const hot = (weather?.maxTemperature ?? 0) >= 38;
    const firstReminder = reminders[0];

    const priorities: FarmPlanItem[] = [
      rain >= 60
        ? { title: isHi ? 'आज सिंचाई रोकें' : 'Pause irrigation today', detail: isHi ? `${rain}% बारिश की संभावना है। खेत की जल निकासी जाँचें।` : `${rain}% rain chance is expected. Check field drainage.`, tone: 'weather' }
        : { title: isHi ? 'मिट्टी की नमी जाँचें' : 'Check soil moisture', detail: profile?.irrigation === 'rainfed' ? (isHi ? 'बारिश पर निर्भर खेत में जड़ क्षेत्र की नमी देखें।' : 'Check root-zone moisture on your rain-fed field.') : (isHi ? 'सिंचाई से पहले ऊपरी मिट्टी की नमी जाँचें।' : 'Check the topsoil before starting irrigation.'), tone: 'primary' },
      { title: isHi ? `${crop} का निरीक्षण करें` : `Inspect ${crop}`, detail: isHi ? 'पत्तियों के दोनों तरफ नए धब्बे, कीट या मुरझाना देखें।' : 'Check both sides of leaves for new spots, insects, or wilting.', tone: 'warning' },
      firstReminder
        ? { title: firstReminder.message || (isHi ? 'आगामी खेत कार्य' : 'Upcoming farm task'), detail: new Date(`${firstReminder.reminder_date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), tone: 'neutral' }
        : { title: isHi ? 'आज की प्रगति दर्ज करें' : 'Record today’s progress', detail: isHi ? 'फसल की स्थिति नोट करें ताकि अगली सलाह बेहतर हो।' : 'Note crop condition so the next advice stays relevant.', tone: 'neutral' },
    ];

    const guidance = [
      { key: 'crop', title: isHi ? 'फसल मार्गदर्शन' : 'Crop guidance', detail: isHi ? `${crop} अभी ${stage} चरण में है। समान बढ़वार और खरपतवार पर ध्यान दें।` : `${crop} is in the ${stage} stage. Focus on even growth and weed control.` },
      { key: 'water', title: isHi ? 'सिंचाई' : 'Irrigation', detail: rain >= 60 ? (isHi ? 'बारिश के बाद मिट्टी देखकर ही अगली सिंचाई तय करें।' : 'Recheck soil after rainfall before the next irrigation.') : (isHi ? 'सुबह जल्दी सिंचाई करें और जलभराव से बचें।' : 'Irrigate early and avoid standing water around roots.') },
      { key: 'nutrient', title: isHi ? 'खाद और पोषण' : 'Fertilizer & nutrients', detail: isHi ? 'खाद देने से पहले मिट्टी की नमी और पत्तियों का रंग जाँचें; मात्रा मिट्टी जाँच के अनुसार रखें।' : 'Check soil moisture and leaf colour before feeding; follow your soil-test dose.' },
      { key: 'pest', title: isHi ? 'कीट और रोग' : 'Pest & disease', detail: hot ? (isHi ? 'गर्मी में रस चूसने वाले कीट तेजी से बढ़ सकते हैं। शाम को निरीक्षण करें।' : 'Heat can increase sucking pests. Inspect the crop this evening.') : (isHi ? 'सप्ताह में दो बार पत्तियों और तनों का निरीक्षण करें।' : 'Scout leaves and stems twice this week.') },
      { key: 'weather', title: isHi ? 'मौसम आधारित सलाह' : 'Weather-based advice', detail: weather ? (isHi ? `आज ${weather.minTemperature}–${weather.maxTemperature}°C, बारिश ${rain}% और हवा ${weather.windSpeed} किमी/घंटा।` : `Today: ${weather.minTemperature}–${weather.maxTemperature}°C, ${rain}% rain, wind ${weather.windSpeed} km/h.`) : (isHi ? 'स्थान अनुमति दें ताकि मौसम आधारित सलाह मिल सके।' : 'Allow location to receive weather-based advice.') },
      (() => {
        const humid = rain >= 50;
        const sensitive = stage.toLowerCase().includes('flower') || stage.includes('फूल');
        const needSpray = hot || (humid && (sensitive || (age ?? 0) > 14));
        const why = hot
          ? (isHi ? 'तेज गर्मी में माहू, सफेद मक्खी, थ्रिप्स बढ़ते हैं।' : 'High heat favours aphids, whitefly and thrips.')
          : (isHi ? 'नमी वाले मौसम में फफूंद रोग (झुलसा, धब्बे) का खतरा है।' : 'Humid, rainy weather raises fungal disease risk (blight, leaf spot).');
        return {
          key: 'spray',
          title: isHi ? 'कीटनाशक / दवा की ज़रूरत' : 'Pesticide needed?',
          detail: needSpray
            ? (isHi
              ? `शायद हाँ — ${why} पहले खेत देखें; 10 में से 1–2 पौधों से ज़्यादा प्रभावित हों तभी छिड़काव करें। नीम तेल (5 मि.ली./लीटर) से शुरू करें, बारिश से पहले और दोपहर में छिड़काव न करें। सही दवा के लिए फसल स्कैन करें।`
              : `Possibly yes — ${why} Scout first; spray only if more than 1–2 in 10 plants are affected. Start with neem oil (5 ml/litre); don't spray before rain or at midday. Scan the crop to get the exact product.`)
            : (isHi
              ? 'अभी नहीं — मौसम और फसल अवस्था के अनुसार अभी छिड़काव की ज़रूरत नहीं है। बिना लक्षण दवा न डालें; पैसा और मिट्टी दोनों बचेंगे।'
              : 'Not right now — weather and crop stage show low pest risk. Avoid spraying without symptoms; it saves money and protects soil.'),
        };
      })(),
    ];

    return { priorities, guidance, stage };
  }, [age, isHi, profile, reminders, weather]);

  return { ...plan, weather, weatherLoading, reminders };
}