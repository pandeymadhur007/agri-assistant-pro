import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface MiniWeather {
  temp: number;
  description: string;
  alert: string | null;
  location: string;
}

const labels: Record<string, { check: string; soon: string; loading: string; tap: string }> = {
  en: { check: 'Check weather', soon: 'Weather Alert', loading: 'Loading weather...', tap: 'View 5-day forecast' },
  hi: { check: 'मौसम देखें', soon: 'मौसम चेतावनी', loading: 'मौसम लोड हो रहा है...', tap: '5-दिन का पूर्वानुमान देखें' },
};

export function WeatherWidget() {
  const { language } = useLanguage();
  const t = labels[language] || labels.en;
  const [weather, setWeather] = useState<MiniWeather | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,precipitation_probability_max&timezone=auto&forecast_days=2`
          );
          const data = await res.json();
          const code = data.current.weather_code;
          const temp = Math.round(data.current.temperature_2m);
          const wind = data.current.wind_speed_10m;
          const humidity = data.current.relative_humidity_2m;
          const tomorrowRain = data.daily?.precipitation_probability_max?.[1] ?? 0;

          let description = 'Clear';
          if (code >= 51 && code <= 67) description = 'Rainy';
          else if (code >= 80 && code <= 99) description = 'Storm';
          else if (code >= 1 && code <= 3) description = 'Cloudy';

          let alert: string | null = null;
          if (tomorrowRain > 70) alert = language === 'hi' ? '🌧️ कल भारी बारिश की संभावना — कीटनाशक छिड़काव टालें' : '🌧️ Heavy rain likely tomorrow — postpone spraying';
          else if (temp > 38) alert = language === 'hi' ? '🌡️ अत्यधिक गर्मी — सुबह जल्दी सिंचाई करें' : '🌡️ Extreme heat — irrigate early morning';
          else if (temp < 8) alert = language === 'hi' ? '❄️ ठंड का खतरा — संवेदनशील फसलों को ढकें' : '❄️ Frost risk — cover sensitive crops';
          else if (wind > 30) alert = language === 'hi' ? '💨 तेज हवाएं — छिड़काव से बचें' : '💨 Strong winds — avoid spraying';
          else if (humidity > 85) alert = language === 'hi' ? '💧 अधिक नमी — फंगल रोग की निगरानी करें' : '💧 High humidity — monitor for fungal disease';

          const locRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const locData = await locRes.json();
          const location = locData.address?.city || locData.address?.town || locData.address?.village || '';

          setWeather({ temp, description, alert, location });
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      },
      () => setLoading(false),
      { timeout: 5000, maximumAge: 600000 }
    );
  }, [language]);

  if (loading || !weather) return null;

  const Icon = weather.description === 'Rainy' ? CloudRain : weather.description === 'Cloudy' ? Cloud : Sun;

  return (
    <Link to="/weather">
      <Card className={`overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow ${weather.alert ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-amber-500' : 'bg-gradient-to-r from-sky-50 to-blue-50'}`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${weather.alert ? 'bg-amber-100' : 'bg-sky-100'}`}>
            {weather.alert ? <AlertTriangle className="w-7 h-7 text-amber-600" /> : <Icon className="w-7 h-7 text-sky-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{weather.temp}°C</span>
              <span className="text-sm text-muted-foreground truncate">{weather.location}</span>
            </div>
            {weather.alert ? (
              <p className="text-sm text-amber-900 font-medium truncate">{weather.alert}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t.tap}</p>
            )}
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
