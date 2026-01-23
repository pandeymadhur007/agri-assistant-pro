import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cloud, Sun, CloudRain, Wind, Droplets, ThermometerSun, 
  MapPin, RefreshCw, MessageCircle, ArrowRight, Loader2,
  CloudSun, CloudDrizzle, CloudLightning, Snowflake, CloudFog
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const translations = {
  en: {
    title: 'Weather Forecast',
    subtitle: 'Get accurate weather updates for your farm',
    requestLocation: 'Enable Location',
    requestLocationDesc: 'Allow location access for accurate local weather',
    loading: 'Fetching weather data...',
    currentWeather: 'Current Weather',
    forecast: '5-Day Forecast',
    humidity: 'Humidity',
    wind: 'Wind Speed',
    feelsLike: 'Feels Like',
    pressure: 'Pressure',
    visibility: 'Visibility',
    uvIndex: 'UV Index',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    farmingTips: 'Farming Tips Based on Weather',
    refresh: 'Refresh',
    moreHelp: 'Need Specific Advice?',
    moreHelpDesc: 'Ask our AI about weather-based farming decisions',
    chatNow: 'Chat with AI Assistant',
    locationError: 'Unable to get location. Please enable location services.',
    weatherError: 'Unable to fetch weather data. Please try again.',
  },
  hi: {
    title: 'मौसम पूर्वानुमान',
    subtitle: 'अपने खेत के लिए सटीक मौसम अपडेट प्राप्त करें',
    requestLocation: 'स्थान सक्षम करें',
    requestLocationDesc: 'सटीक स्थानीय मौसम के लिए स्थान पहुंच की अनुमति दें',
    loading: 'मौसम डेटा प्राप्त हो रहा है...',
    currentWeather: 'वर्तमान मौसम',
    forecast: '5-दिवसीय पूर्वानुमान',
    humidity: 'आर्द्रता',
    wind: 'हवा की गति',
    feelsLike: 'महसूस होता है',
    pressure: 'दबाव',
    visibility: 'दृश्यता',
    uvIndex: 'UV सूचकांक',
    sunrise: 'सूर्योदय',
    sunset: 'सूर्यास्त',
    farmingTips: 'मौसम के आधार पर खेती के टिप्स',
    refresh: 'रिफ्रेश',
    moreHelp: 'विशिष्ट सलाह चाहिए?',
    moreHelpDesc: 'मौसम-आधारित खेती निर्णयों के बारे में हमारे AI से पूछें',
    chatNow: 'AI सहायक से चैट करें',
    locationError: 'स्थान प्राप्त करने में असमर्थ। कृपया स्थान सेवाएं सक्षम करें।',
    weatherError: 'मौसम डेटा प्राप्त करने में असमर्थ। कृपया पुनः प्रयास करें।',
  },
  mr: {
    title: 'हवामान अंदाज',
    subtitle: 'तुमच्या शेतासाठी अचूक हवामान अपडेट मिळवा',
    requestLocation: 'स्थान सक्षम करा',
    requestLocationDesc: 'अचूक स्थानिक हवामानासाठी स्थान प्रवेशास अनुमती द्या',
    loading: 'हवामान डेटा आणत आहे...',
    currentWeather: 'सध्याचे हवामान',
    forecast: '5-दिवसांचा अंदाज',
    humidity: 'आर्द्रता',
    wind: 'वाऱ्याचा वेग',
    feelsLike: 'जाणवते',
    pressure: 'दाब',
    visibility: 'दृश्यमानता',
    uvIndex: 'UV निर्देशांक',
    sunrise: 'सूर्योदय',
    sunset: 'सूर्यास्त',
    farmingTips: 'हवामानावर आधारित शेती टिप्स',
    refresh: 'रिफ्रेश',
    moreHelp: 'विशिष्ट सल्ला हवा?',
    moreHelpDesc: 'हवामान-आधारित शेती निर्णयांबद्दल आमच्या AI ला विचारा',
    chatNow: 'AI सहाय्यकाशी चॅट करा',
    locationError: 'स्थान मिळवण्यात अक्षम. कृपया स्थान सेवा सक्षम करा.',
    weatherError: 'हवामान डेटा आणण्यात अक्षम. कृपया पुन्हा प्रयत्न करा.',
  },
  te: {
    title: 'వాతావరణ సూచన',
    subtitle: 'మీ పొలానికి ఖచ్చితమైన వాతావరణ నవీకరణలు పొందండి',
    requestLocation: 'స్థానాన్ని ప్రారంభించండి',
    requestLocationDesc: 'ఖచ్చితమైన స్థానిక వాతావరణం కోసం స్థాన యాక్సెస్‌ను అనుమతించండి',
    loading: 'వాతావరణ డేటాను పొందుతోంది...',
    currentWeather: 'ప్రస్తుత వాతావరణం',
    forecast: '5-రోజుల సూచన',
    humidity: 'తేమ',
    wind: 'గాలి వేగం',
    feelsLike: 'అనిపిస్తుంది',
    pressure: 'పీడనం',
    visibility: 'దృశ్యమానత',
    uvIndex: 'UV సూచిక',
    sunrise: 'సూర్యోదయం',
    sunset: 'సూర్యాస్తమయం',
    farmingTips: 'వాతావరణం ఆధారంగా వ్యవసాయ చిట్కాలు',
    refresh: 'రిఫ్రెష్',
    moreHelp: 'నిర్దిష్ట సలహా కావాలా?',
    moreHelpDesc: 'వాతావరణ ఆధారిత వ్యవసాయ నిర్ణయాల గురించి మా AIని అడగండి',
    chatNow: 'AI సహాయకుడితో చాట్ చేయండి',
    locationError: 'స్థానం పొందడం సాధ్యం కాలేదు. దయచేసి స్థాన సేవలను ప్రారంభించండి.',
    weatherError: 'వాతావరణ డేటా పొందడం సాధ్యం కాలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.',
  },
  ta: {
    title: 'வானிலை முன்னறிவிப்பு',
    subtitle: 'உங்கள் பண்ணைக்கான துல்லியமான வானிலை புதுப்பிப்புகளைப் பெறுங்கள்',
    requestLocation: 'இருப்பிடத்தை இயக்கு',
    requestLocationDesc: 'துல்லியமான உள்ளூர் வானிலைக்கு இருப்பிட அணுகலை அனுமதிக்கவும்',
    loading: 'வானிலை தரவை பெறுகிறது...',
    currentWeather: 'தற்போதைய வானிலை',
    forecast: '5-நாள் முன்னறிவிப்பு',
    humidity: 'ஈரப்பதம்',
    wind: 'காற்றின் வேகம்',
    feelsLike: 'உணர்வு',
    pressure: 'அழுத்தம்',
    visibility: 'தெரிவுநிலை',
    uvIndex: 'UV குறியீடு',
    sunrise: 'சூரிய உதயம்',
    sunset: 'சூரிய அஸ்தமனம்',
    farmingTips: 'வானிலை அடிப்படையிலான விவசாய குறிப்புகள்',
    refresh: 'புதுப்பி',
    moreHelp: 'குறிப்பிட்ட ஆலோசனை வேண்டுமா?',
    moreHelpDesc: 'வானிலை அடிப்படையிலான விவசாய முடிவுகள் பற்றி எங்கள் AI-யிடம் கேளுங்கள்',
    chatNow: 'AI உதவியாளருடன் அரட்டையடியுங்கள்',
    locationError: 'இருப்பிடம் பெற முடியவில்லை. இருப்பிட சேவைகளை இயக்கவும்.',
    weatherError: 'வானிலை தரவை பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
  },
  bn: {
    title: 'আবহাওয়ার পূর্বাভাস',
    subtitle: 'আপনার খামারের জন্য সঠিক আবহাওয়া আপডেট পান',
    requestLocation: 'অবস্থান সক্রিয় করুন',
    requestLocationDesc: 'সঠিক স্থানীয় আবহাওয়ার জন্য অবস্থান অ্যাক্সেসের অনুমতি দিন',
    loading: 'আবহাওয়া ডেটা আনা হচ্ছে...',
    currentWeather: 'বর্তমান আবহাওয়া',
    forecast: '5-দিনের পূর্বাভাস',
    humidity: 'আর্দ্রতা',
    wind: 'বাতাসের গতি',
    feelsLike: 'অনুভূত হচ্ছে',
    pressure: 'চাপ',
    visibility: 'দৃশ্যমানতা',
    uvIndex: 'UV সূচক',
    sunrise: 'সূর্যোদয়',
    sunset: 'সূর্যাস্ত',
    farmingTips: 'আবহাওয়া ভিত্তিক কৃষি টিপস',
    refresh: 'রিফ্রেশ',
    moreHelp: 'নির্দিষ্ট পরামর্শ দরকার?',
    moreHelpDesc: 'আবহাওয়া-ভিত্তিক কৃষি সিদ্ধান্ত সম্পর্কে আমাদের AI কে জিজ্ঞাসা করুন',
    chatNow: 'AI সহায়কের সাথে চ্যাট করুন',
    locationError: 'অবস্থান পেতে অক্ষম। দয়া করে অবস্থান পরিষেবা সক্রিয় করুন।',
    weatherError: 'আবহাওয়া ডেটা আনতে অক্ষম। অনুগ্রহ করে আবার চেষ্টা করুন।',
  },
};

interface WeatherData {
  location: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  pressure: number;
  visibility: number;
  sunrise: string;
  sunset: string;
}

interface ForecastDay {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

const getWeatherIcon = (iconCode: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    '01d': Sun,
    '01n': Sun,
    '02d': CloudSun,
    '02n': CloudSun,
    '03d': Cloud,
    '03n': Cloud,
    '04d': Cloud,
    '04n': Cloud,
    '09d': CloudDrizzle,
    '09n': CloudDrizzle,
    '10d': CloudRain,
    '10n': CloudRain,
    '11d': CloudLightning,
    '11n': CloudLightning,
    '13d': Snowflake,
    '13n': Snowflake,
    '50d': CloudFog,
    '50n': CloudFog,
  };
  return iconMap[iconCode] || Cloud;
};

const getFarmingTips = (weather: WeatherData | null, language: string) => {
  if (!weather) return [];
  
  const tips = {
    en: [] as string[],
    hi: [] as string[],
  };
  
  // Temperature-based tips
  if (weather.temp > 35) {
    tips.en.push('🌡️ High temperature alert! Water crops early morning or late evening to reduce evaporation.');
    tips.hi.push('🌡️ उच्च तापमान चेतावनी! वाष्पीकरण कम करने के लिए सुबह जल्दी या शाम को देर से फसलों को पानी दें।');
  } else if (weather.temp < 10) {
    tips.en.push('❄️ Cold weather expected. Cover sensitive crops and delay irrigation to prevent frost damage.');
    tips.hi.push('❄️ ठंड का मौसम अपेक्षित। संवेदनशील फसलों को ढकें और पाले से नुकसान रोकने के लिए सिंचाई में देरी करें।');
  }
  
  // Humidity-based tips
  if (weather.humidity > 80) {
    tips.en.push('💧 High humidity increases disease risk. Monitor for fungal infections and ensure good air circulation.');
    tips.hi.push('💧 उच्च आर्द्रता से रोग का खतरा बढ़ता है। फंगल संक्रमण की निगरानी करें और अच्छा वायु संचार सुनिश्चित करें।');
  } else if (weather.humidity < 30) {
    tips.en.push('🏜️ Low humidity - increase irrigation frequency and consider mulching to retain soil moisture.');
    tips.hi.push('🏜️ कम आर्द्रता - सिंचाई की आवृत्ति बढ़ाएं और मिट्टी की नमी बनाए रखने के लिए मल्चिंग पर विचार करें।');
  }
  
  // Wind-based tips
  if (weather.windSpeed > 20) {
    tips.en.push('💨 Strong winds expected. Avoid spraying pesticides and support tall crops to prevent lodging.');
    tips.hi.push('💨 तेज हवाएं अपेक्षित। कीटनाशक छिड़काव से बचें और गिरने से बचाने के लिए लंबी फसलों को सहारा दें।');
  }
  
  // Description-based tips
  if (weather.description.toLowerCase().includes('rain')) {
    tips.en.push('🌧️ Rain expected. Postpone fertilizer application and ensure proper field drainage.');
    tips.hi.push('🌧️ बारिश की संभावना। उर्वरक आवेदन स्थगित करें और उचित खेत जल निकासी सुनिश्चित करें।');
  }
  
  if (tips.en.length === 0) {
    tips.en.push('☀️ Good weather for farming activities. Ideal time for sowing, transplanting, or spraying.');
    tips.hi.push('☀️ खेती की गतिविधियों के लिए अच्छा मौसम। बुवाई, रोपाई या छिड़काव के लिए आदर्श समय।');
  }
  
  return language === 'hi' || language === 'mr' ? tips.hi : tips.en;
};

const Weather = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = translations[language] || translations.en;

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      // Using Open-Meteo API (free, no API key required)
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,wind_speed_10m_max,sunrise,sunset&timezone=auto`
      );
      
      if (!weatherRes.ok) throw new Error('Weather fetch failed');
      
      const data = await weatherRes.json();
      
      // Get location name using reverse geocoding
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const geoData = await geoRes.json();
      const locationName = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.state || 'Your Location';
      
      // Map weather codes to descriptions and icons
      const getWeatherInfo = (code: number) => {
        const weatherMap: Record<number, { desc: string; icon: string }> = {
          0: { desc: 'Clear sky', icon: '01d' },
          1: { desc: 'Mainly clear', icon: '02d' },
          2: { desc: 'Partly cloudy', icon: '03d' },
          3: { desc: 'Overcast', icon: '04d' },
          45: { desc: 'Foggy', icon: '50d' },
          48: { desc: 'Depositing rime fog', icon: '50d' },
          51: { desc: 'Light drizzle', icon: '09d' },
          53: { desc: 'Moderate drizzle', icon: '09d' },
          55: { desc: 'Dense drizzle', icon: '09d' },
          61: { desc: 'Slight rain', icon: '10d' },
          63: { desc: 'Moderate rain', icon: '10d' },
          65: { desc: 'Heavy rain', icon: '10d' },
          71: { desc: 'Slight snow', icon: '13d' },
          73: { desc: 'Moderate snow', icon: '13d' },
          75: { desc: 'Heavy snow', icon: '13d' },
          80: { desc: 'Slight rain showers', icon: '09d' },
          81: { desc: 'Moderate rain showers', icon: '09d' },
          82: { desc: 'Violent rain showers', icon: '09d' },
          95: { desc: 'Thunderstorm', icon: '11d' },
          96: { desc: 'Thunderstorm with hail', icon: '11d' },
          99: { desc: 'Thunderstorm with heavy hail', icon: '11d' },
        };
        return weatherMap[code] || { desc: 'Unknown', icon: '03d' };
      };
      
      const currentInfo = getWeatherInfo(data.current.weather_code);
      
      setWeather({
        location: locationName,
        temp: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        description: currentInfo.desc,
        icon: currentInfo.icon,
        pressure: Math.round(data.current.surface_pressure),
        visibility: 10, // Open-Meteo doesn't provide visibility
        sunrise: new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sunset: new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      
      // Process forecast
      const forecastDays: ForecastDay[] = data.daily.time.slice(0, 5).map((date: string, index: number) => {
        const info = getWeatherInfo(data.daily.weather_code[index]);
        return {
          date,
          dayName: new Date(date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' }),
          tempMax: Math.round(data.daily.temperature_2m_max[index]),
          tempMin: Math.round(data.daily.temperature_2m_min[index]),
          description: info.desc,
          icon: info.icon,
          humidity: data.daily.relative_humidity_2m_max[index],
          windSpeed: Math.round(data.daily.wind_speed_10m_max[index]),
        };
      });
      
      setForecast(forecastDays);
      setLocationGranted(true);
    } catch (error) {
      console.error('Weather fetch error:', error);
      toast({
        title: 'Error',
        description: t.weatherError,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: t.locationError,
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoading(false);
        toast({
          title: 'Error',
          description: t.locationError,
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const farmingTips = getFarmingTips(weather, language);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Cloud className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t.title}</h1>
          <p className="text-muted-foreground text-lg">{t.subtitle}</p>
        </div>

        {!locationGranted ? (
          /* Request Location Card */
          <Card className="max-w-md mx-auto text-center p-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 mb-6">
              <MapPin className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t.requestLocation}</h2>
            <p className="text-muted-foreground mb-6">{t.requestLocationDesc}</p>
            <Button onClick={requestLocation} disabled={loading} size="lg" className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.loading}
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  {t.requestLocation}
                </>
              )}
            </Button>
          </Card>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        ) : weather && (
          <>
            {/* Current Weather */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">{t.currentWeather}</h2>
                <Button variant="outline" size="sm" onClick={requestLocation} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  {t.refresh}
                </Button>
              </div>
              
              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Main weather info */}
                    <div className="text-center md:text-left">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{weather.location}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {(() => {
                          const IconComponent = getWeatherIcon(weather.icon);
                          return <IconComponent className="w-20 h-20 text-blue-500" />;
                        })()}
                        <div>
                          <div className="text-5xl font-bold">{weather.temp}°C</div>
                          <div className="text-lg text-muted-foreground capitalize">{weather.description}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Weather details grid */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <ThermometerSun className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                        <div className="text-sm text-muted-foreground">{t.feelsLike}</div>
                        <div className="font-semibold">{weather.feelsLike}°C</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <Droplets className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                        <div className="text-sm text-muted-foreground">{t.humidity}</div>
                        <div className="font-semibold">{weather.humidity}%</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <Wind className="w-6 h-6 mx-auto text-teal-500 mb-1" />
                        <div className="text-sm text-muted-foreground">{t.wind}</div>
                        <div className="font-semibold">{weather.windSpeed} km/h</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <Cloud className="w-6 h-6 mx-auto text-gray-500 mb-1" />
                        <div className="text-sm text-muted-foreground">{t.pressure}</div>
                        <div className="font-semibold">{weather.pressure} hPa</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <Sun className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
                        <div className="text-sm text-muted-foreground">{t.sunrise}</div>
                        <div className="font-semibold">{weather.sunrise}</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <Sun className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                        <div className="text-sm text-muted-foreground">{t.sunset}</div>
                        <div className="font-semibold">{weather.sunset}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 5-Day Forecast */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{t.forecast}</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {forecast.map((day, index) => {
                  const IconComponent = getWeatherIcon(day.icon);
                  return (
                    <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="font-semibold text-lg mb-2">{day.dayName}</div>
                        <IconComponent className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                        <div className="flex justify-center gap-2 mb-1">
                          <span className="font-bold">{day.tempMax}°</span>
                          <span className="text-muted-foreground">{day.tempMin}°</span>
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">{day.description}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Farming Tips */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">{t.farmingTips}</h2>
              <Card>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {farmingTips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm md:text-base">
                        <span className="text-lg">{tip.slice(0, 2)}</span>
                        <span>{tip.slice(3)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          </>
        )}

        {/* CTA */}
        <section className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-500/20 mb-4">
            <MessageCircle className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{t.moreHelp}</h2>
          <p className="text-muted-foreground mb-6">{t.moreHelpDesc}</p>
          <Button
            size="lg"
            onClick={() => navigate('/chat')}
            className="gap-2"
          >
            {t.chatNow}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Weather;
