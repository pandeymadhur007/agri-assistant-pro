import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, MapPin, IndianRupee, Star, Wheat } from 'lucide-react';

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
  crop_name_hi: string | null;
  msp_price: number;
  season: string | null;
  year: string;
}

const MarketPriceCrop = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [mspRate, setMspRate] = useState<MSPRate | null>(null);
  const [loading, setLoading] = useState(true);

  const cropName = decodeURIComponent(name || '');

  useEffect(() => {
    if (cropName) fetchCropData();
  }, [cropName]);

  const fetchCropData = async () => {
    try {
      const [pricesRes, mspRes] = await Promise.all([
        supabase.from('market_prices').select('*').eq('crop_name', cropName).order('price', { ascending: false }),
        supabase.from('msp_rates').select('*').eq('crop_name', cropName).single()
      ]);

      if (pricesRes.data) setPrices(pricesRes.data);
      if (mspRes.data) setMspRate(mspRes.data);
    } catch (error) {
      console.error('Error fetching crop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string | null) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const bestPrice = prices.length > 0 ? prices[0] : null;
  const avgPrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p.price, 0) / prices.length : 0;

  const labels = {
    en: {
      back: 'Back to Market Prices',
      msp: 'MSP (Minimum Support Price)',
      bestMandi: 'Best Price Mandi',
      avgPrice: 'Average Price',
      allMandis: 'All Mandis',
      season: 'Season',
      year: 'Year',
      perQuintal: '/quintal',
      noData: 'No price data found for this crop',
      loading: 'Loading...',
    },
    hi: {
      back: 'मंडी भाव पर वापस',
      msp: 'MSP (न्यूनतम समर्थन मूल्य)',
      bestMandi: 'सबसे अच्छा भाव मंडी',
      avgPrice: 'औसत भाव',
      allMandis: 'सभी मंडियां',
      season: 'सीजन',
      year: 'वर्ष',
      perQuintal: '/क्विंटल',
      noData: 'इस फसल के लिए कोई भाव नहीं मिला',
      loading: 'लोड हो रहा है...',
    }
  };

  const l = labels[language as keyof typeof labels] || labels.en;
  const displayName = language === 'hi' && prices[0]?.crop_name_hi ? prices[0].crop_name_hi : cropName;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/market-prices')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {l.back}
        </Button>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{l.loading}</div>
        ) : prices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{l.noData}</div>
        ) : (
          <>
            {/* Crop Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-full bg-primary/10">
                <Wheat className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {mspRate && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-amber-700">{l.msp}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <IndianRupee className="h-5 w-5 text-amber-700" />
                      <span className="text-2xl font-bold text-amber-700">{mspRate.msp_price.toLocaleString()}</span>
                      <span className="text-sm text-amber-600">{l.perQuintal}</span>
                    </div>
                    <div className="mt-2 text-sm text-amber-600">
                      {l.season}: {mspRate.season} | {l.year}: {mspRate.year}
                    </div>
                  </CardContent>
                </Card>
              )}

              {bestPrice && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-green-600" />
                      <CardTitle className="text-sm text-green-700">{l.bestMandi}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <IndianRupee className="h-5 w-5 text-green-700" />
                      <span className="text-2xl font-bold text-green-700">{bestPrice.price.toLocaleString()}</span>
                      <span className="text-sm text-green-600">{l.perQuintal}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                      <MapPin className="h-3 w-3" />
                      {bestPrice.mandi}, {bestPrice.state}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{l.avgPrice}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-1">
                    <IndianRupee className="h-5 w-5 text-foreground" />
                    <span className="text-2xl font-bold text-foreground">{avgPrice.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">{l.perQuintal}</span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {prices.length} mandis
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* All Mandis */}
            <h2 className="text-xl font-semibold mb-4">{l.allMandis}</h2>
            <div className="space-y-3">
              {prices.map((price, index) => (
                <Card key={price.id} className={index === 0 ? 'border-green-200 bg-green-50/50' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {index === 0 && <Badge className="bg-green-600">Best</Badge>}
                        <div>
                          <div className="font-medium">{price.mandi}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {price.district}, {price.state}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-baseline gap-1">
                            <IndianRupee className="h-4 w-4" />
                            <span className="text-lg font-bold">{price.price.toLocaleString()}</span>
                          </div>
                          {mspRate && (
                            <div className={`text-xs ${price.price >= mspRate.msp_price ? 'text-green-600' : 'text-red-600'}`}>
                              {price.price >= mspRate.msp_price ? '+' : ''}
                              {(((price.price - mspRate.msp_price) / mspRate.msp_price) * 100).toFixed(1)}% MSP
                            </div>
                          )}
                        </div>
                        {getTrendIcon(price.price_trend)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MarketPriceCrop;