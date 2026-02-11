import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Store, MapPin, Search, IndianRupee, Wheat, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MarketPrice {
  id: string;
  crop_name: string;
  crop_name_hi: string | null;
  state: string;
  district: string;
  mandi: string;
  price: number;
  unit: string;
  price_date: string;
  price_trend: string | null;
}

interface MSPRate {
  crop_name: string;
  msp_price: number;
}

const MarketPrices = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [mspRates, setMspRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const states = [...new Set(prices.map(p => p.state))].sort();
  const crops = [...new Set(prices.map(p => p.crop_name))].sort();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pricesRes, mspRes] = await Promise.all([
        supabase.from('market_prices').select('*').order('price_date', { ascending: false }),
        supabase.from('msp_rates').select('crop_name, msp_price')
      ]);

      if (pricesRes.data) setPrices(pricesRes.data);
      if (mspRes.data) {
        const mspMap: Record<string, number> = {};
        mspRes.data.forEach((m: MSPRate) => { mspMap[m.crop_name] = m.msp_price; });
        setMspRates(mspMap);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-market-prices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        toast({ title: language === 'hi' ? 'भाव अपडेट हुए' : 'Prices Updated', description: `${data.count} prices fetched from government mandi data` });
        await fetchData();
      } else {
        toast({ title: 'Update failed', description: data.error || 'Could not fetch latest prices', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to refresh prices', variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  const filteredPrices = prices.filter(p => {
    const matchesState = selectedState === 'all' || p.state === selectedState;
    const matchesCrop = selectedCrop === 'all' || p.crop_name === selectedCrop;
    const matchesSearch = searchQuery === '' || 
      p.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mandi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesCrop && matchesSearch;
  });

  const getTrendIcon = (trend: string | null) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: string | null) => {
    if (trend === 'up') return 'bg-green-100 text-green-700 border-green-200';
    if (trend === 'down') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-muted text-muted-foreground';
  };

  const getMSPComparison = (cropName: string, price: number) => {
    const msp = mspRates[cropName];
    if (!msp) return null;
    const diff = ((price - msp) / msp) * 100;
    return { msp, diff };
  };

  const labels = {
    en: {
      title: 'Market Prices',
      subtitle: 'Today\'s mandi prices with MSP comparison',
      searchPlaceholder: 'Search crop or mandi...',
      allStates: 'All States',
      allCrops: 'All Crops',
      msp: 'MSP',
      perQuintal: '/quintal',
      aboveMsp: 'above MSP',
      belowMsp: 'below MSP',
      noData: 'No price data available',
      loading: 'Loading prices...',
    },
    hi: {
      title: 'मंडी भाव',
      subtitle: 'आज के मंडी भाव और MSP तुलना',
      searchPlaceholder: 'फसल या मंडी खोजें...',
      allStates: 'सभी राज्य',
      allCrops: 'सभी फसलें',
      msp: 'MSP',
      perQuintal: '/क्विंटल',
      aboveMsp: 'MSP से ऊपर',
      belowMsp: 'MSP से नीचे',
      noData: 'कोई भाव उपलब्ध नहीं',
      loading: 'भाव लोड हो रहे हैं...',
    }
  };

  const l = labels[language as keyof typeof labels] || labels.en;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{l.title}</h1>
                <p className="text-sm text-muted-foreground">{l.subtitle}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPrices}
              disabled={refreshing}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? (language === 'hi' ? 'अपडेट हो रहा...' : 'Updating...') : (language === 'hi' ? 'लाइव भाव लाएं' : 'Fetch Live Prices')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={l.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={l.allStates} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{l.allStates}</SelectItem>
              {states.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={l.allCrops} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{l.allCrops}</SelectItem>
              {crops.map(crop => (
                <SelectItem key={crop} value={crop}>{crop}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Cards */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{l.loading}</div>
        ) : filteredPrices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{l.noData}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrices.map((price) => {
              const comparison = getMSPComparison(price.crop_name, price.price);
              return (
                <Card 
                  key={price.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/market-prices/crop/${encodeURIComponent(price.crop_name)}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Wheat className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          {language === 'hi' && price.crop_name_hi ? price.crop_name_hi : price.crop_name}
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className={getTrendColor(price.price_trend)}>
                        {getTrendIcon(price.price_trend)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1 mb-3">
                      <IndianRupee className="h-5 w-5 text-foreground" />
                      <span className="text-2xl font-bold text-foreground">{price.price.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">{l.perQuintal}</span>
                    </div>
                    
                    {comparison && (
                      <div className="mb-3 p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{l.msp}: ₹{comparison.msp.toLocaleString()}</span>
                          <span className={comparison.diff >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {comparison.diff >= 0 ? '+' : ''}{comparison.diff.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{price.mandi}, {price.district}</span>
                    </div>
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

export default MarketPrices;