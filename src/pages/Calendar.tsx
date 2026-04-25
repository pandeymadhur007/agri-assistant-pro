import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Sprout, Droplets, Bug, Wheat, ChevronRight, Sun } from 'lucide-react';

interface CropCalendar {
  id: string;
  crop_name: string;
  crop_name_hi: string | null;
  region: string[] | null;
  sowing_start_month: number | null;
  sowing_end_month: number | null;
  harvest_start_month: number | null;
  harvest_end_month: number | null;
  fertilizer_months: number[] | null;
  irrigation_frequency: string | null;
  pest_risk_months: number[] | null;
  notes_en: string | null;
  notes_hi: string | null;
}

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  hi: ['जन', 'फर', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुला', 'अग', 'सित', 'अक्टू', 'नव', 'दिस']
};

const Calendar = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState<CropCalendar[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    fetchCalendars();
  }, []);

  const fetchCalendars = async () => {
    try {
      const { data, error } = await supabase.from('crop_calendar').select('*').order('crop_name');
      if (error) throw error;
      if (data) setCalendars(data);
    } catch (error) {
      console.error('Error fetching calendars:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const monthArr = language === 'hi' ? MONTHS.hi : MONTHS.en;
    return monthArr[month - 1];
  };

  const getMonthRange = (start: number | null, end: number | null) => {
    if (!start || !end) return '';
    return `${getMonthName(start)} - ${getMonthName(end)}`;
  };

  const isCurrentActivity = (startMonth: number | null, endMonth: number | null) => {
    if (!startMonth || !endMonth) return false;
    if (startMonth <= endMonth) {
      return currentMonth >= startMonth && currentMonth <= endMonth;
    } else {
      return currentMonth >= startMonth || currentMonth <= endMonth;
    }
  };

  const isPestRiskNow = (months: number[] | null) => {
    if (!months) return false;
    return months.includes(currentMonth);
  };

  const labels = {
    en: {
      title: 'Farming Calendar',
      subtitle: 'Crop-wise schedule for sowing, harvest, and care',
      sowing: 'Sowing',
      harvest: 'Harvest',
      fertilizer: 'Fertilizer',
      irrigation: 'Irrigation',
      pestRisk: 'Pest Risk',
      now: 'Now',
      currentActivities: 'Current Activities',
      viewDetails: 'View Details',
      noData: 'No calendar data available',
      loading: 'Loading calendar...',
    },
    hi: {
      title: 'खेती कैलेंडर',
      subtitle: 'फसल-वार बुवाई, कटाई और देखभाल कार्यक्रम',
      sowing: 'बुवाई',
      harvest: 'कटाई',
      fertilizer: 'खाद',
      irrigation: 'सिंचाई',
      pestRisk: 'कीट जोखिम',
      now: 'अभी',
      currentActivities: 'वर्तमान गतिविधियां',
      viewDetails: 'विवरण देखें',
      noData: 'कोई कैलेंडर डेटा उपलब्ध नहीं',
      loading: 'कैलेंडर लोड हो रहा है...',
    }
  };

  const l = labels[language as keyof typeof labels] || labels.en;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{l.title}</h1>
              <p className="text-sm text-muted-foreground">{l.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Current Month Indicator */}
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', year: 'numeric' })}
              </span>
              <Badge variant="secondary">{l.currentActivities}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Crop Cards */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{l.loading}</div>
        ) : calendars.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{l.noData}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calendars.map((cal) => {
              const isSowingNow = isCurrentActivity(cal.sowing_start_month, cal.sowing_end_month);
              const isHarvestNow = isCurrentActivity(cal.harvest_start_month, cal.harvest_end_month);
              const pestRiskNow = isPestRiskNow(cal.pest_risk_months);
              const displayName = language === 'hi' && cal.crop_name_hi ? cal.crop_name_hi : cal.crop_name;

              return (
                <Card 
                  key={cal.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/calendar/crop/${encodeURIComponent(cal.crop_name)}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wheat className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{displayName}</CardTitle>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {cal.region && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cal.region.slice(0, 3).map((r, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Sowing */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Sprout className="h-4 w-4 text-green-600" />
                        <span>{l.sowing}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {getMonthRange(cal.sowing_start_month, cal.sowing_end_month)}
                        </span>
                        {isSowingNow && <Badge className="bg-green-600 text-xs">{l.now}</Badge>}
                      </div>
                    </div>

                    {/* Harvest */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Wheat className="h-4 w-4 text-amber-600" />
                        <span>{l.harvest}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {getMonthRange(cal.harvest_start_month, cal.harvest_end_month)}
                        </span>
                        {isHarvestNow && <Badge className="bg-amber-600 text-xs">{l.now}</Badge>}
                      </div>
                    </div>

                    {/* Irrigation */}
                    {cal.irrigation_frequency && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Droplets className="h-4 w-4 text-blue-600" />
                          <span>{l.irrigation}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{cal.irrigation_frequency}</span>
                      </div>
                    )}

                    {/* Pest Risk Alert */}
                    {pestRiskNow && (
                      <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200">
                        <div className="flex items-center gap-2 text-sm text-red-700">
                          <Bug className="h-4 w-4" />
                          <span className="font-medium">{l.pestRisk}: {l.now}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Calendar;