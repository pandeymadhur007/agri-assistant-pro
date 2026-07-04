import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { SEO } from '@/components/SEO';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Store, MapPin, Search, IndianRupee, Wheat, RefreshCw, Sparkles } from 'lucide-react';
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

interface MarketPricesCache {
  prices: MarketPrice[];
  mspRates: Record<string, number>;
  cachedAt: number;
}

const MARKET_PRICES_CACHE_KEY = 'market-prices-cache-v1';
const MARKET_PRICES_CACHE_TTL_MS = 15 * 60 * 1000;
const EMPTY_DATA_RETRY_LIMIT = 1;
const EMPTY_DATA_RETRY_DELAY_MS = 800;

const readMarketPricesCache = (): MarketPricesCache | null => {
  try {
    const raw = localStorage.getItem(MARKET_PRICES_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as MarketPricesCache;
    if (!parsed?.cachedAt || Date.now() - parsed.cachedAt > MARKET_PRICES_CACHE_TTL_MS) {
      localStorage.removeItem(MARKET_PRICES_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const writeMarketPricesCache = (prices: MarketPrice[], mspRates: Record<string, number>) => {
  try {
    const payload: MarketPricesCache = {
      prices,
      mspRates,
      cachedAt: Date.now(),
    };
    localStorage.setItem(MARKET_PRICES_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore cache write failures.
  }
};

const MarketPrices = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [mspRates, setMspRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const states = useMemo(() => [...new Set(prices.map(p => p.state))].sort(), [prices]);
  const crops = useMemo(() => [...new Set(prices.map(p => p.crop_name))].sort(), [prices]);

  const queryMarketData = useCallback(async () => {
    const [pricesRes, mspRes] = await Promise.all([
      supabase
        .from('market_prices')
        .select('id, crop_name, crop_name_hi, state, district, mandi, price, unit, price_date, price_trend')
        .order('price_date', { ascending: false })
        .limit(600),
      supabase.from('msp_rates').select('crop_name, msp_price')
    ]);

    if (pricesRes.error) throw pricesRes.error;
    if (mspRes.error) throw mspRes.error;

    const nextPrices = pricesRes.data ?? [];
    const nextMspRates = (mspRes.data ?? []).reduce<Record<string, number>>((acc, rate: MSPRate) => {
      acc[rate.crop_name] = rate.msp_price;
      return acc;
    }, {});

    return { nextPrices, nextMspRates };
  }, []);

  const fetchData = useCallback(async (attempt = 0) => {
    let shouldRetry = false;

    try {
      const { nextPrices, nextMspRates } = await queryMarketData();

      if (nextPrices.length === 0 && attempt < EMPTY_DATA_RETRY_LIMIT) {
        shouldRetry = true;
        window.setTimeout(() => {
          void fetchData(attempt + 1);
        }, EMPTY_DATA_RETRY_DELAY_MS);
        return;
      }

      if (nextPrices.length > 0) {
        setPrices(nextPrices);
        setMspRates(nextMspRates);
        writeMarketPricesCache(nextPrices, nextMspRates);
      } else if (attempt >= EMPTY_DATA_RETRY_LIMIT) {
        setPrices([]);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      if (!shouldRetry) {
        setLoading(false);
      }
    }
  }, [queryMarketData]);

  useEffect(() => {
    const cached = readMarketPricesCache();

    if (cached) {
      setPrices(cached.prices);
      setMspRates(cached.mspRates);
      setLoading(false);
    }

    void fetchData();
  }, [fetchData]);

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-market-prices');

      if (!error && data?.success) {
        toast({ title: language === 'hi' ? 'भाव अपडेट हुए' : 'Prices Updated', description: `${data.count} prices fetched from government mandi data` });
        await fetchData();
      } else {
        toast({ title: 'Update failed', description: error?.message || data?.error || 'Could not fetch latest prices', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to refresh prices', variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  const filteredPrices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return prices.filter(p => {
      if (selectedState !== 'all' && p.state !== selectedState) return false;
      if (selectedCrop !== 'all' && p.crop_name !== selectedCrop) return false;
      if (q && !p.crop_name.toLowerCase().includes(q) && !p.mandi.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [prices, selectedState, selectedCrop, searchQuery]);

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
      <SEO
        title="Live Mandi Prices Across India"
        description="Track live mandi prices and MSP rates for crops across Indian states and districts — updated daily."
      />
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

        {/* Source / unit disclaimer */}
        <div className="mb-3 p-3 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground leading-relaxed">
          {language === 'hi'
            ? 'भाव: सरकारी Agmarknet (data.gov.in) से सीधे लिए गए थोक मंडी रेट हैं — ₹ प्रति क्विंटल (1 क्विंटल = 100 किलो)। Google पर दिखने वाले खुदरा (retail) भाव इनसे ज़्यादा होते हैं।'
            : 'Prices are live wholesale mandi rates from the Government of India Agmarknet feed (data.gov.in), shown in ₹ per quintal (1 quintal = 100 kg). Retail prices on Google are typically higher than these wholesale rates.'}
        </div>

        {/* AI Insight hint banner */}
        <div className="mb-4 p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">
            {language === 'hi'
              ? 'किसी भी फसल पर टैप करें — 30‑दिन का ग्राफ, AI ट्रेंड और "अभी बेचें या रुकें" सलाह देखें।'
              : 'Tap any crop card to see its 30‑day price chart, AI trend forecast, and a "sell now vs wait" recommendation.'}
          </p>
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
                    <div className="-mt-2 mb-3 text-xs text-muted-foreground">
                      ≈ ₹{(price.price / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}/kg
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
                    
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{price.mandi}, {price.district}</span>
                      </div>
                      <Badge variant="outline" className="shrink-0 border-primary/40 text-primary text-[10px] gap-1">
                        <Sparkles className="h-3 w-3" />
                        {language === 'hi' ? 'AI सलाह' : 'AI Insight'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default MarketPrices;