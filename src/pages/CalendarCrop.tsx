import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sprout, Droplets, Bug, Wheat, Leaf, CalendarCheck, AlertTriangle } from 'lucide-react';

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

const MONTHS_FULL = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  hi: ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']
};

const CalendarCrop = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [calendar, setCalendar] = useState<CropCalendar | null>(null);
  const [loading, setLoading] = useState(true);

  const cropName = decodeURIComponent(name || '');
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    if (cropName) fetchCalendar();
  }, [cropName]);

  const fetchCalendar = async () => {
    try {
      const { data, error } = await supabase
        .from('crop_calendar')
        .select('*')
        .eq('crop_name', cropName)
        .single();
      if (error) throw error;
      if (data) setCalendar(data);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const monthArr = language === 'hi' ? MONTHS_FULL.hi : MONTHS_FULL.en;
    return monthArr[month - 1];
  };

  const getMonthRange = (start: number | null, end: number | null) => {
    if (!start || !end) return '';
    return `${getMonthName(start)} - ${getMonthName(end)}`;
  };

  const isMonthInRange = (month: number, start: number | null, end: number | null) => {
    if (!start || !end) return false;
    if (start <= end) return month >= start && month <= end;
    return month >= start || month <= end;
  };

  const labels = {
    en: {
      back: 'Back to Calendar',
      sowing: 'Sowing Period',
      harvest: 'Harvest Period',
      fertilizer: 'Fertilizer Months',
      irrigation: 'Irrigation',
      pestRisk: 'Pest Risk Period',
      notes: 'Important Notes',
      regions: 'Growing Regions',
      timeline: 'Year Timeline',
      currentMonth: 'Current Month',
      noData: 'Calendar not found',
      loading: 'Loading...',
    },
    hi: {
      back: 'कैलेंडर पर वापस',
      sowing: 'बुवाई अवधि',
      harvest: 'कटाई अवधि',
      fertilizer: 'खाद के महीने',
      irrigation: 'सिंचाई',
      pestRisk: 'कीट जोखिम अवधि',
      notes: 'महत्वपूर्ण नोट्स',
      regions: 'उगाने वाले क्षेत्र',
      timeline: 'वर्ष समयरेखा',
      currentMonth: 'वर्तमान महीना',
      noData: 'कैलेंडर नहीं मिला',
      loading: 'लोड हो रहा है...',
    }
  };

  const l = labels[language as keyof typeof labels] || labels.en;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{l.loading}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => navigate('/calendar')} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {l.back}
          </Button>
          <p className="text-center text-muted-foreground">{l.noData}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = language === 'hi' && calendar.crop_name_hi ? calendar.crop_name_hi : calendar.crop_name;
  const notes = language === 'hi' && calendar.notes_hi ? calendar.notes_hi : calendar.notes_en;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate('/calendar')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          {l.back}
        </Button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-primary/10">
            <Wheat className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
            {calendar.region && (
              <div className="flex flex-wrap gap-1 mt-1">
                {calendar.region.map((r, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{l.timeline}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                const isSowing = isMonthInRange(month, calendar.sowing_start_month, calendar.sowing_end_month);
                const isHarvest = isMonthInRange(month, calendar.harvest_start_month, calendar.harvest_end_month);
                const isFertilizer = calendar.fertilizer_months?.includes(month);
                const isPestRisk = calendar.pest_risk_months?.includes(month);
                const isCurrent = month === currentMonth;

                return (
                  <div key={month} className="text-center">
                    <div className={`text-xs mb-1 ${isCurrent ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {getMonthName(month).slice(0, 3)}
                    </div>
                    <div className={`h-8 rounded flex flex-col items-center justify-center text-xs relative ${
                      isCurrent ? 'ring-2 ring-primary' : ''
                    } ${
                      isSowing ? 'bg-green-200' : 
                      isHarvest ? 'bg-amber-200' : 
                      isPestRisk ? 'bg-red-100' : 
                      'bg-muted'
                    }`}>
                      {isFertilizer && <Leaf className="h-3 w-3 text-green-700" />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-200"></div> {l.sowing}</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-200"></div> {l.harvest}</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-100"></div> {l.pestRisk}</div>
              <div className="flex items-center gap-1"><Leaf className="h-3 w-3 text-green-700" /> {l.fertilizer}</div>
            </div>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Sprout className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-green-700">{l.sowing}</h3>
              </div>
              <p className="text-lg font-medium text-green-800">
                {getMonthRange(calendar.sowing_start_month, calendar.sowing_end_month)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Wheat className="h-6 w-6 text-amber-600" />
                <h3 className="font-semibold text-amber-700">{l.harvest}</h3>
              </div>
              <p className="text-lg font-medium text-amber-800">
                {getMonthRange(calendar.harvest_start_month, calendar.harvest_end_month)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Droplets className="h-6 w-6 text-blue-600" />
                <h3 className="font-semibold text-blue-700">{l.irrigation}</h3>
              </div>
              <p className="text-lg font-medium text-blue-800">
                {calendar.irrigation_frequency || '-'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Bug className="h-6 w-6 text-red-600" />
                <h3 className="font-semibold text-red-700">{l.pestRisk}</h3>
              </div>
              <div className="flex flex-wrap gap-1">
                {calendar.pest_risk_months?.map(m => (
                  <Badge 
                    key={m} 
                    variant={m === currentMonth ? 'destructive' : 'outline'}
                    className={m === currentMonth ? '' : 'border-red-300 text-red-700'}
                  >
                    {getMonthName(m)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {notes && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{l.notes}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{notes}</p>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CalendarCrop;