import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Loader2, History, Leaf, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCropScan } from '@/hooks/useCropScan';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const translations = {
  en: {
    title: 'AI Crop Doctor',
    subtitle: 'Upload or capture a photo of your crop to detect diseases and get treatment advice',
    takePhoto: 'Take Photo',
    uploadImage: 'Upload Image',
    scanCrop: 'Scan Crop',
    viewHistory: 'View History',
    uploading: 'Uploading...',
    analyzing: 'AI is analyzing your crop...',
    dropHere: 'Drop image here or click to upload',
    supportedFormats: 'Supported: JPG, PNG, WebP (max 5MB)',
    tips: 'Tips for best results',
    tip1: 'Take clear, focused photos of affected leaves',
    tip2: 'Include both healthy and diseased parts',
    tip3: 'Use good lighting conditions',
    tip4: 'Capture close-up shots of symptoms',
  },
  hi: {
    title: 'AI फसल डॉक्टर',
    subtitle: 'रोग का पता लगाने और उपचार सलाह पाने के लिए अपनी फसल की फोटो अपलोड करें',
    takePhoto: 'फोटो लें',
    uploadImage: 'इमेज अपलोड करें',
    scanCrop: 'फसल स्कैन करें',
    viewHistory: 'इतिहास देखें',
    uploading: 'अपलोड हो रहा है...',
    analyzing: 'AI आपकी फसल का विश्लेषण कर रहा है...',
    dropHere: 'यहाँ इमेज डालें या अपलोड करने के लिए क्लिक करें',
    supportedFormats: 'समर्थित: JPG, PNG, WebP (अधिकतम 5MB)',
    tips: 'बेहतर परिणामों के लिए टिप्स',
    tip1: 'प्रभावित पत्तियों की स्पष्ट फोटो लें',
    tip2: 'स्वस्थ और रोगग्रस्त दोनों हिस्सों को शामिल करें',
    tip3: 'अच्छी रोशनी में फोटो लें',
    tip4: 'लक्षणों की क्लोज-अप तस्वीरें लें',
  },
  mr: {
    title: 'AI पीक डॉक्टर',
    subtitle: 'रोग शोधण्यासाठी आणि उपचार सल्ला मिळवण्यासाठी तुमच्या पिकाचा फोटो अपलोड करा',
    takePhoto: 'फोटो काढा',
    uploadImage: 'इमेज अपलोड करा',
    scanCrop: 'पीक स्कॅन करा',
    viewHistory: 'इतिहास पहा',
    uploading: 'अपलोड होत आहे...',
    analyzing: 'AI तुमच्या पिकाचे विश्लेषण करत आहे...',
    dropHere: 'येथे इमेज टाका किंवा अपलोड करण्यासाठी क्लिक करा',
    supportedFormats: 'समर्थित: JPG, PNG, WebP (कमाल 5MB)',
    tips: 'चांगल्या परिणामांसाठी टिप्स',
    tip1: 'प्रभावित पानांचे स्पष्ट फोटो घ्या',
    tip2: 'निरोगी आणि रोगग्रस्त दोन्ही भाग समाविष्ट करा',
    tip3: 'चांगल्या प्रकाशात फोटो काढा',
    tip4: 'लक्षणांचे क्लोज-अप फोटो घ्या',
  },
  te: {
    title: 'AI పంట డాక్టర్',
    subtitle: 'వ్యాధులను గుర్తించడానికి మరియు చికిత్స సలహా పొందడానికి మీ పంట ఫోటోను అప్‌లోడ్ చేయండి',
    takePhoto: 'ఫోటో తీయండి',
    uploadImage: 'చిత్రాన్ని అప్‌లోడ్ చేయండి',
    scanCrop: 'పంటను స్కాన్ చేయండి',
    viewHistory: 'చరిత్ర చూడండి',
    uploading: 'అప్‌లోడ్ అవుతోంది...',
    analyzing: 'AI మీ పంటను విశ్లేషిస్తోంది...',
    dropHere: 'ఇక్కడ చిత్రాన్ని వదలండి లేదా అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి',
    supportedFormats: 'సపోర్ట్: JPG, PNG, WebP (గరిష్టంగా 5MB)',
    tips: 'మంచి ఫలితాల కోసం చిట్కాలు',
    tip1: 'ప్రభావిత ఆకుల స్పష్టమైన ఫోటోలు తీయండి',
    tip2: 'ఆరోగ్యకరమైన మరియు వ్యాధిగ్రస్త భాగాలు రెండింటినీ చేర్చండి',
    tip3: 'మంచి వెలుతురులో ఫోటోలు తీయండి',
    tip4: 'లక్షణాల క్లోజ్-అప్ షాట్లు తీయండి',
  },
  ta: {
    title: 'AI பயிர் மருத்துவர்',
    subtitle: 'நோய்களைக் கண்டறிய மற்றும் சிகிச்சை ஆலோசனை பெற உங்கள் பயிரின் புகைப்படத்தை பதிவேற்றவும்',
    takePhoto: 'புகைப்படம் எடுக்கவும்',
    uploadImage: 'படத்தை பதிவேற்றவும்',
    scanCrop: 'பயிரை ஸ்கேன் செய்யவும்',
    viewHistory: 'வரலாற்றைக் காண்க',
    uploading: 'பதிவேற்றுகிறது...',
    analyzing: 'AI உங்கள் பயிரை பகுப்பாய்வு செய்கிறது...',
    dropHere: 'படத்தை இங்கே விடுங்கள் அல்லது பதிவேற்ற கிளிக் செய்யவும்',
    supportedFormats: 'ஆதரவு: JPG, PNG, WebP (அதிகபட்சம் 5MB)',
    tips: 'சிறந்த முடிவுகளுக்கான குறிப்புகள்',
    tip1: 'பாதிக்கப்பட்ட இலைகளின் தெளிவான புகைப்படங்களை எடுங்கள்',
    tip2: 'ஆரோக்கியமான மற்றும் நோயுற்ற பகுதிகளை சேர்க்கவும்',
    tip3: 'நல்ல வெளிச்சத்தில் புகைப்படங்கள் எடுங்கள்',
    tip4: 'அறிகுறிகளின் க்ளோஸ்-அப் ஷாட்களை எடுங்கள்',
  },
  bn: {
    title: 'AI ফসল ডাক্তার',
    subtitle: 'রোগ সনাক্ত করতে এবং চিকিৎসার পরামর্শ পেতে আপনার ফসলের ছবি আপলোড করুন',
    takePhoto: 'ছবি তুলুন',
    uploadImage: 'ছবি আপলোড করুন',
    scanCrop: 'ফসল স্ক্যান করুন',
    viewHistory: 'ইতিহাস দেখুন',
    uploading: 'আপলোড হচ্ছে...',
    analyzing: 'AI আপনার ফসল বিশ্লেষণ করছে...',
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-xl shadow-primary/25">
                <Leaf className="w-10 h-10 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-accent-foreground" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 gradient-text">{t.title}</h1>
            <p className="text-muted-foreground max-w-md mx-auto">{t.subtitle}</p>
          </div>

          {/* Upload Area */}
          <Card className="mb-6 border-0 shadow-xl">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                    {previewUrl && (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="absolute -bottom-2 -right-2 w-12 h-12 object-cover rounded-xl border-4 border-background shadow-lg"
                      />
                    )}
                  </div>
                  <p className="text-lg font-medium text-foreground mt-6">
                    {isUploading ? t.uploading : t.analyzing}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">This may take a few seconds...</p>
                </div>
              ) : (
                <>
                  {/* Drop Zone */}
                  <div
                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                      isDragging 
                        ? 'border-primary bg-primary/5 scale-[1.02]' 
                        : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-2">{t.dropHere}</p>
                    <p className="text-sm text-muted-foreground">{t.supportedFormats}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <Button
                      variant="outline"
                      className="h-14 text-base rounded-xl border-2 hover:bg-secondary"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      {t.takePhoto}
                    </Button>
                    <Button
                      className="h-14 text-base rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all"
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
            className="w-full mb-6 h-12 rounded-xl border-2"
            onClick={() => navigate('/scan/history')}
          >
            <History className="w-5 h-5 mr-2" />
            {t.viewHistory}
          </Button>

          {/* Tips Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-lg">💡</span>
                {t.tips}
              </h3>
              <ul className="space-y-3">
                {[t.tip1, t.tip2, t.tip3, t.tip4].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
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
