import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Leaf, Bug, Pill, Shield, Info, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CropDiagnosis } from '@/hooks/useCropScan';

const translations = {
  en: {
    title: 'Scan Result',
    back: 'Back',
    scanAnother: 'Scan Another Crop',
    cropName: 'Crop',
    disease: 'Disease Detected',
    severity: 'Severity',
    cause: 'Cause',
    treatment: 'Treatment',
    pesticide: 'Recommended Pesticide/Fertilizer',
    prevention: 'Prevention Tips',
    additionalNotes: 'Additional Notes',
    notPlant: 'This image does not appear to be a plant or crop.',
    severityLevels: {
      healthy: 'Healthy',
      mild: 'Mild',
      moderate: 'Moderate',
      severe: 'Severe',
      critical: 'Critical',
    },
  },
  hi: {
    title: 'स्कैन परिणाम',
    back: 'वापस',
    scanAnother: 'एक और फसल स्कैन करें',
    cropName: 'फसल',
    disease: 'पता चला रोग',
    severity: 'गंभीरता',
    cause: 'कारण',
    treatment: 'उपचार',
    pesticide: 'सुझाया गया कीटनाशक/उर्वरक',
    prevention: 'रोकथाम के उपाय',
    additionalNotes: 'अतिरिक्त टिप्पणियाँ',
    notPlant: 'यह छवि पौधा या फसल नहीं लगती।',
    severityLevels: {
      healthy: 'स्वस्थ',
      mild: 'हल्का',
      moderate: 'मध्यम',
      severe: 'गंभीर',
      critical: 'अत्यंत गंभीर',
    },
  },
  mr: {
    title: 'स्कॅन परिणाम',
    back: 'मागे',
    scanAnother: 'आणखी एक पीक स्कॅन करा',
    cropName: 'पीक',
    disease: 'आढळलेला रोग',
    severity: 'तीव्रता',
    cause: 'कारण',
    treatment: 'उपचार',
    pesticide: 'शिफारस केलेले कीटकनाशक/खत',
    prevention: 'प्रतिबंध टिप्स',
    additionalNotes: 'अतिरिक्त टिपा',
    notPlant: 'ही प्रतिमा वनस्पती किंवा पीक नाही असे दिसते.',
    severityLevels: {
      healthy: 'निरोगी',
      mild: 'सौम्य',
      moderate: 'मध्यम',
      severe: 'तीव्र',
      critical: 'गंभीर',
    },
  },
  te: {
    title: 'స్కాన్ ఫలితం',
    back: 'వెనుకకు',
    scanAnother: 'మరో పంటను స్కాన్ చేయండి',
    cropName: 'పంట',
    disease: 'గుర్తించిన వ్యాధి',
    severity: 'తీవ్రత',
    cause: 'కారణం',
    treatment: 'చికిత్స',
    pesticide: 'సిఫార్సు చేసిన పురుగుమందు/ఎరువు',
    prevention: 'నివారణ చిట్కాలు',
    additionalNotes: 'అదనపు గమనికలు',
    notPlant: 'ఈ చిత్రం మొక్క లేదా పంటగా కనిపించడం లేదు.',
    severityLevels: {
      healthy: 'ఆరోగ్యకరం',
      mild: 'తేలిక',
      moderate: 'మధ్యస్థం',
      severe: 'తీవ్రం',
      critical: 'అత్యంత తీవ్రం',
    },
  },
  ta: {
    title: 'ஸ்கேன் முடிவு',
    back: 'பின்செல்',
    scanAnother: 'மற்றொரு பயிரை ஸ்கேன் செய்யவும்',
    cropName: 'பயிர்',
    disease: 'கண்டறியப்பட்ட நோய்',
    severity: 'தீவிரம்',
    cause: 'காரணம்',
    treatment: 'சிகிச்சை',
    pesticide: 'பரிந்துரைக்கப்பட்ட பூச்சிக்கொல்லி/உரம்',
    prevention: 'தடுப்பு குறிப்புகள்',
    additionalNotes: 'கூடுதல் குறிப்புகள்',
    notPlant: 'இந்த படம் தாவரம் அல்லது பயிர் அல்ல என்று தெரிகிறது.',
    severityLevels: {
      healthy: 'ஆரோக்கியமான',
      mild: 'லேசான',
      moderate: 'மிதமான',
      severe: 'தீவிர',
      critical: 'மிகவும் தீவிர',
    },
  },
  bn: {
    title: 'স্ক্যান ফলাফল',
    back: 'পিছনে',
    scanAnother: 'আরেকটি ফসল স্ক্যান করুন',
    cropName: 'ফসল',
    disease: 'সনাক্ত রোগ',
    severity: 'তীব্রতা',
    cause: 'কারণ',
    treatment: 'চিকিৎসা',
    pesticide: 'প্রস্তাবিত কীটনাশক/সার',
    prevention: 'প্রতিরোধ টিপস',
    additionalNotes: 'অতিরিক্ত টীকা',
    notPlant: 'এই ছবি গাছ বা ফসল মনে হচ্ছে না।',
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
      return 'bg-green-100 text-green-800 border-green-300';
    case 'mild':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'moderate':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'severe':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'critical':
      return 'bg-red-200 text-red-900 border-red-400';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const ScanResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  const { imageUrl, diagnosis } = location.state as { 
    imageUrl: string; 
    diagnosis: CropDiagnosis;
  } || {};

  if (!diagnosis) {
    navigate('/scan');
    return null;
  }

  const isHealthy = diagnosis.severity === 'healthy';

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

          {/* Image Preview */}
          <Card className="mb-6 overflow-hidden">
            <div className="relative">
              <img 
                src={imageUrl} 
                alt="Scanned crop" 
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 right-4">
                <Badge className={`${getSeverityColor(diagnosis.severity)} text-sm px-3 py-1`}>
                  {isHealthy ? (
                    <CheckCircle className="w-4 h-4 mr-1 inline" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-1 inline" />
                  )}
                  {t.severityLevels[diagnosis.severity as keyof typeof t.severityLevels]}
                </Badge>
              </div>
            </div>
          </Card>

          {!diagnosis.is_plant ? (
            <Card className="mb-6">
              <CardContent className="p-6 text-center">
                <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t.notPlant}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Crop & Disease Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Leaf className="w-4 h-4" />
                      <span className="text-sm">{t.cropName}</span>
                    </div>
                    <p className="font-semibold text-lg">{diagnosis.crop_name}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Bug className="w-4 h-4" />
                      <span className="text-sm">{t.disease}</span>
                    </div>
                    <p className="font-semibold text-lg">{diagnosis.disease_name}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Cause */}
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    {t.cause}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{diagnosis.cause}</p>
                </CardContent>
              </Card>

              {/* Treatment */}
              <Card className="mb-4 border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-green-800">
                    <Pill className="w-4 h-4" />
                    {t.treatment}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-800">{diagnosis.treatment}</p>
                </CardContent>
              </Card>

              {/* Pesticide/Fertilizer */}
              <Card className="mb-4 border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                    <Pill className="w-4 h-4" />
                    {t.pesticide}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-800">{diagnosis.pesticide}</p>
                </CardContent>
              </Card>

              {/* Prevention */}
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-500" />
                    {t.prevention}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{diagnosis.prevention}</p>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              {diagnosis.additional_notes && (
                <Card className="mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="w-4 h-4 text-gray-500" />
                      {t.additionalNotes}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{diagnosis.additional_notes}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Scan Another Button */}
          <Button 
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            onClick={() => navigate('/scan')}
          >
            <Camera className="w-5 h-5 mr-2" />
            {t.scanAnother}
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ScanResult;
