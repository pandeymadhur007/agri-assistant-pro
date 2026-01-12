import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Loader2, History, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCropScan } from '@/hooks/useCropScan';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const translations = {
  en: {
    title: 'Crop Disease Scanner',
    subtitle: 'Upload or capture a photo of your crop to detect diseases and get treatment advice',
    takePhoto: 'Take Photo',
    uploadImage: 'Upload Image',
    scanCrop: 'Scan Crop',
    viewHistory: 'View History',
    uploading: 'Uploading...',
    analyzing: 'Analyzing...',
    dropHere: 'Drop image here or click to upload',
    supportedFormats: 'Supported: JPG, PNG, WebP (max 5MB)',
    tips: 'Tips for best results',
    tip1: 'Take clear, focused photos of affected leaves',
    tip2: 'Include both healthy and diseased parts',
    tip3: 'Use good lighting conditions',
    tip4: 'Capture close-up shots of symptoms',
  },
  hi: {
    title: 'फसल रोग स्कैनर',
    subtitle: 'रोग का पता लगाने और उपचार सलाह पाने के लिए अपनी फसल की फोटो अपलोड करें',
    takePhoto: 'फोटो लें',
    uploadImage: 'इमेज अपलोड करें',
    scanCrop: 'फसल स्कैन करें',
    viewHistory: 'इतिहास देखें',
    uploading: 'अपलोड हो रहा है...',
    analyzing: 'विश्लेषण हो रहा है...',
    dropHere: 'यहाँ इमेज डालें या अपलोड करने के लिए क्लिक करें',
    supportedFormats: 'समर्थित: JPG, PNG, WebP (अधिकतम 5MB)',
    tips: 'बेहतर परिणामों के लिए टिप्स',
    tip1: 'प्रभावित पत्तियों की स्पष्ट फोटो लें',
    tip2: 'स्वस्थ और रोगग्रस्त दोनों हिस्सों को शामिल करें',
    tip3: 'अच्छी रोशनी में फोटो लें',
    tip4: 'लक्षणों की क्लोज-अप तस्वीरें लें',
  },
  mr: {
    title: 'पीक रोग स्कॅनर',
    subtitle: 'रोग शोधण्यासाठी आणि उपचार सल्ला मिळवण्यासाठी तुमच्या पिकाचा फोटो अपलोड करा',
    takePhoto: 'फोटो काढा',
    uploadImage: 'इमेज अपलोड करा',
    scanCrop: 'पीक स्कॅन करा',
    viewHistory: 'इतिहास पहा',
    uploading: 'अपलोड होत आहे...',
    analyzing: 'विश्लेषण होत आहे...',
    dropHere: 'येथे इमेज टाका किंवा अपलोड करण्यासाठी क्लिक करा',
    supportedFormats: 'समर्थित: JPG, PNG, WebP (कमाल 5MB)',
    tips: 'चांगल्या परिणामांसाठी टिप्स',
    tip1: 'प्रभावित पानांचे स्पष्ट फोटो घ्या',
    tip2: 'निरोगी आणि रोगग्रस्त दोन्ही भाग समाविष्ट करा',
    tip3: 'चांगल्या प्रकाशात फोटो काढा',
    tip4: 'लक्षणांचे क्लोज-अप फोटो घ्या',
  },
  te: {
    title: 'పంట వ్యాధి స్కానర్',
    subtitle: 'వ్యాధులను గుర్తించడానికి మరియు చికిత్స సలహా పొందడానికి మీ పంట ఫోటోను అప్‌లోడ్ చేయండి',
    takePhoto: 'ఫోటో తీయండి',
    uploadImage: 'చిత్రాన్ని అప్‌లోడ్ చేయండి',
    scanCrop: 'పంటను స్కాన్ చేయండి',
    viewHistory: 'చరిత్ర చూడండి',
    uploading: 'అప్‌లోడ్ అవుతోంది...',
    analyzing: 'విశ్లేషిస్తోంది...',
    dropHere: 'ఇక్కడ చిత్రాన్ని వదలండి లేదా అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి',
    supportedFormats: 'సపోర్ట్: JPG, PNG, WebP (గరిష్టంగా 5MB)',
    tips: 'మంచి ఫలితాల కోసం చిట్కాలు',
    tip1: 'ప్రభావిత ఆకుల స్పష్టమైన ఫోటోలు తీయండి',
    tip2: 'ఆరోగ్యకరమైన మరియు వ్యాధిగ్రస్త భాగాలు రెండింటినీ చేర్చండి',
    tip3: 'మంచి వెలుతురులో ఫోటోలు తీయండి',
    tip4: 'లక్షణాల క్లోజ్-అప్ షాట్లు తీయండి',
  },
  ta: {
    title: 'பயிர் நோய் ஸ்கேனர்',
    subtitle: 'நோய்களைக் கண்டறிய மற்றும் சிகிச்சை ஆலோசனை பெற உங்கள் பயிரின் புகைப்படத்தை பதிவேற்றவும்',
    takePhoto: 'புகைப்படம் எடுக்கவும்',
    uploadImage: 'படத்தை பதிவேற்றவும்',
    scanCrop: 'பயிரை ஸ்கேன் செய்யவும்',
    viewHistory: 'வரலாற்றைக் காண்க',
    uploading: 'பதிவேற்றுகிறது...',
    analyzing: 'பகுப்பாய்வு செய்கிறது...',
    dropHere: 'படத்தை இங்கே விடுங்கள் அல்லது பதிவேற்ற கிளிக் செய்யவும்',
    supportedFormats: 'ஆதரவு: JPG, PNG, WebP (அதிகபட்சம் 5MB)',
    tips: 'சிறந்த முடிவுகளுக்கான குறிப்புகள்',
    tip1: 'பாதிக்கப்பட்ட இலைகளின் தெளிவான புகைப்படங்களை எடுங்கள்',
    tip2: 'ஆரோக்கியமான மற்றும் நோயுற்ற பகுதிகளை சேர்க்கவும்',
    tip3: 'நல்ல வெளிச்சத்தில் புகைப்படங்கள் எடுங்கள்',
    tip4: 'அறிகுறிகளின் க்ளோஸ்-அப் ஷாட்களை எடுங்கள்',
  },
  bn: {
    title: 'ফসল রোগ স্ক্যানার',
    subtitle: 'রোগ সনাক্ত করতে এবং চিকিৎসার পরামর্শ পেতে আপনার ফসলের ছবি আপলোড করুন',
    takePhoto: 'ছবি তুলুন',
    uploadImage: 'ছবি আপলোড করুন',
    scanCrop: 'ফসল স্ক্যান করুন',
    viewHistory: 'ইতিহাস দেখুন',
    uploading: 'আপলোড হচ্ছে...',
    analyzing: 'বিশ্লেষণ হচ্ছে...',
    dropHere: 'এখানে ছবি ফেলুন বা আপলোড করতে ক্লিক করুন',
    supportedFormats: 'সমর্থিত: JPG, PNG, WebP (সর্বোচ্চ 5MB)',
    tips: 'ভালো ফলাফলের জন্য টিপস',
    tip1: 'আক্রান্ত পাতার স্পষ্ট ছবি তুলুন',
    tip2: 'সুস্থ ও রোগাক্রান্ত উভয় অংশ অন্তর্ভুক্ত করুন',
    tip3: 'ভালো আলোতে ছবি তুলুন',
    tip4: 'লক্ষণগুলির ক্লোজ-আপ শট নিন',
  },
};

const Scan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  const { uploadImage, analyzeImage, saveScanResult, isUploading, isAnalyzing, error } = useCropScan();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload image
    const imageUrl = await uploadImage(file);
    if (!imageUrl) {
      toast({
        title: 'Upload failed',
        description: error || 'Failed to upload image',
        variant: 'destructive',
      });
      return;
    }

    // Analyze image
    const diagnosis = await analyzeImage(imageUrl);
    if (!diagnosis) {
      toast({
        title: 'Analysis failed',
        description: error || 'Failed to analyze image',
        variant: 'destructive',
      });
      return;
    }

    // Save result
    const scanId = await saveScanResult(imageUrl, diagnosis);
    
    // Navigate to result page
    navigate('/scan/result', { 
      state: { 
        scanId,
        imageUrl, 
        diagnosis,
      } 
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const isLoading = isUploading || isAnalyzing;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>

          {/* Upload Area */}
          <Card className="mb-6">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700">
                    {isUploading ? t.uploading : t.analyzing}
                  </p>
                  {previewUrl && (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg mx-auto mt-4"
                    />
                  )}
                </div>
              ) : (
                <>
                  {/* Drop Zone */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                      isDragging 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">{t.dropHere}</p>
                    <p className="text-sm text-gray-400">{t.supportedFormats}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <Button
                      variant="outline"
                      className="h-14 text-lg"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      {t.takePhoto}
                    </Button>
                    <Button
                      className="h-14 text-lg bg-green-600 hover:bg-green-700"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      {t.uploadImage}
                    </Button>
                  </div>

                  {/* Hidden file inputs */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* History Button */}
          <Button
            variant="outline"
            className="w-full mb-6"
            onClick={() => navigate('/scan/history')}
          >
            <History className="w-5 h-5 mr-2" />
            {t.viewHistory}
          </Button>

          {/* Tips Card */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-green-800 mb-3">{t.tips}</h3>
              <ul className="space-y-2 text-sm text-green-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  {t.tip1}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  {t.tip2}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  {t.tip3}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  {t.tip4}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Scan;
