import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Calendar, Leaf, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCropScan, ScanResult } from '@/hooks/useCropScan';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const translations = {
  en: {
    title: 'Scan History',
    back: 'Back',
    noScans: 'No scans yet',
    noScansDesc: 'Scan your first crop to get started',
    scanNow: 'Scan Crop Now',
    severityLevels: {
      healthy: 'Healthy',
      mild: 'Mild',
      moderate: 'Moderate',
      severe: 'Severe',
      critical: 'Critical',
    },
  },
  hi: {
    title: 'स्कैन इतिहास',
    back: 'वापस',
    noScans: 'अभी तक कोई स्कैन नहीं',
    noScansDesc: 'शुरू करने के लिए अपनी पहली फसल स्कैन करें',
    scanNow: 'अभी फसल स्कैन करें',
    severityLevels: {
      healthy: 'स्वस्थ',
      mild: 'हल्का',
      moderate: 'मध्यम',
      severe: 'गंभीर',
      critical: 'अत्यंत गंभीर',
    },
  },
  mr: {
    title: 'स्कॅन इतिहास',
    back: 'मागे',
    noScans: 'अजून स्कॅन नाहीत',
    noScansDesc: 'सुरू करण्यासाठी तुमचे पहिले पीक स्कॅन करा',
    scanNow: 'आता पीक स्कॅन करा',
    severityLevels: {
      healthy: 'निरोगी',
      mild: 'सौम्य',
      moderate: 'मध्यम',
      severe: 'तीव्र',
      critical: 'गंभीर',
    },
  },
  te: {
    title: 'స్కాన్ చరిత్ర',
    back: 'వెనుకకు',
    noScans: 'ఇంకా స్కాన్‌లు లేవు',
    noScansDesc: 'ప్రారంభించడానికి మీ మొదటి పంటను స్కాన్ చేయండి',
    scanNow: 'ఇప్పుడు పంటను స్కాన్ చేయండి',
    severityLevels: {
      healthy: 'ఆరోగ్యకరం',
      mild: 'తేలిక',
      moderate: 'మధ్యస్థం',
      severe: 'తీవ్రం',
      critical: 'అత్యంత తీవ్రం',
    },
  },
  ta: {
    title: 'ஸ்கேன் வரலாறு',
    back: 'பின்செல்',
    noScans: 'இதுவரை ஸ்கேன்கள் இல்லை',
    noScansDesc: 'தொடங்க உங்கள் முதல் பயிரை ஸ்கேன் செய்யவும்',
    scanNow: 'இப்போது பயிரை ஸ்கேன் செய்யவும்',
    severityLevels: {
      healthy: 'ஆரோக்கியமான',
      mild: 'லேசான',
      moderate: 'மிதமான',
      severe: 'தீவிர',
      critical: 'மிகவும் தீவிர',
    },
  },
  bn: {
    title: 'স্ক্যান ইতিহাস',
    back: 'পিছনে',
    noScans: 'এখনও কোনো স্ক্যান নেই',
    noScansDesc: 'শুরু করতে আপনার প্রথম ফসল স্ক্যান করুন',
    scanNow: 'এখনই ফসল স্ক্যান করুন',
    severityLevels: {
      healthy: 'সুস্থ',
      mild: 'হালকা',
      moderate: 'মাঝারি',
      severe: 'গুরুতর',
      critical: 'অত্যন্ত গুরুতর',
    },
  },
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'healthy':
      return 'bg-green-100 text-green-800';
    case 'mild':
      return 'bg-yellow-100 text-yellow-800';
    case 'moderate':
      return 'bg-orange-100 text-orange-800';
    case 'severe':
      return 'bg-red-100 text-red-800';
    case 'critical':
      return 'bg-red-200 text-red-900';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ScanHistory = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  const { getScanHistory } = useCropScan();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      const history = await getScanHistory();
      setScans(history);
      setIsLoading(false);
    };
    loadHistory();
  }, []);

  const handleScanClick = (scan: ScanResult) => {
    navigate('/scan/result', {
      state: {
        imageUrl: scan.image_url,
        diagnosis: scan.diagnosis,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/scan')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="w-20 h-20 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : scans.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">{t.noScans}</h3>
                <p className="text-gray-500 mb-6">{t.noScansDesc}</p>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => navigate('/scan')}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  {t.scanNow}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {scans.map((scan) => (
                <Card 
                  key={scan.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleScanClick(scan)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img 
                        src={scan.image_url} 
                        alt={scan.diagnosis.crop_name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {scan.diagnosis.crop_name}
                          </h3>
                          <Badge className={getSeverityColor(scan.diagnosis.severity)}>
                            {scan.diagnosis.severity === 'healthy' ? (
                              <CheckCircle className="w-3 h-3 mr-1 inline" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 mr-1 inline" />
                            )}
                            {t.severityLevels[scan.diagnosis.severity as keyof typeof t.severityLevels]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {scan.diagnosis.disease_name}
                        </p>
                        <div className="flex items-center text-xs text-gray-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(scan.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ScanHistory;
