import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bug, MessageCircle, ArrowRight, AlertTriangle, Shield, Leaf } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';

// Import pest images
import bollwormImage from '@/assets/pests/bollworm.jpg';
import whiteflyImage from '@/assets/pests/whitefly.jpg';
import stemBorerImage from '@/assets/pests/stem-borer.jpg';
import aphidsImage from '@/assets/pests/aphids.jpg';
const translations = {
  en: {
    title: 'Pest & Disease Guide',
    subtitle: 'Identify common threats and learn how to protect your crops',
    diseases: 'Crop Diseases',
    pests: 'Harmful Insects',
    moreHelp: 'Need More Help?',
    moreHelpDesc: 'Get personalized advice from our AI assistant',
    chatNow: 'Chat with AI Assistant',
    symptoms: 'Symptoms',
    treatment: 'Treatment',
    prevention: 'Prevention',
  },
  hi: {
    title: 'कीट और रोग गाइड',
    subtitle: 'सामान्य खतरों की पहचान करें और अपनी फसलों की सुरक्षा करना सीखें',
    diseases: 'फसल रोग',
    pests: 'हानिकारक कीड़े',
    moreHelp: 'और मदद चाहिए?',
    moreHelpDesc: 'हमारे AI सहायक से व्यक्तिगत सलाह प्राप्त करें',
    chatNow: 'AI सहायक से चैट करें',
    symptoms: 'लक्षण',
    treatment: 'उपचार',
    prevention: 'रोकथाम',
  },
  mr: {
    title: 'कीटक आणि रोग मार्गदर्शक',
    subtitle: 'सामान्य धोके ओळखा आणि तुमच्या पिकांचे संरक्षण कसे करावे ते शिका',
    diseases: 'पीक रोग',
    pests: 'हानिकारक कीटक',
    moreHelp: 'अधिक मदत हवी?',
    moreHelpDesc: 'आमच्या AI सहाय्यकाकडून वैयक्तिक सल्ला घ्या',
    chatNow: 'AI सहाय्यकाशी चॅट करा',
    symptoms: 'लक्षणे',
    treatment: 'उपचार',
    prevention: 'प्रतिबंध',
  },
  te: {
    title: 'తెగుళ్ళు & వ్యాధుల గైడ్',
    subtitle: 'సాధారణ బెదిరింపులను గుర్తించండి మరియు మీ పంటలను ఎలా రక్షించుకోవాలో నేర్చుకోండి',
    diseases: 'పంట వ్యాధులు',
    pests: 'హానికరమైన కీటకాలు',
    moreHelp: 'మరింత సహాయం కావాలా?',
    moreHelpDesc: 'మా AI సహాయకుడి నుండి వ్యక్తిగత సలహా పొందండి',
    chatNow: 'AI సహాయకుడితో చాట్ చేయండి',
    symptoms: 'లక్షణాలు',
    treatment: 'చికిత్స',
    prevention: 'నివారణ',
  },
  ta: {
    title: 'பூச்சி & நோய் வழிகாட்டி',
    subtitle: 'பொதுவான அச்சுறுத்தல்களை அடையாளம் காணுங்கள் மற்றும் உங்கள் பயிர்களை எவ்வாறு பாதுகாப்பது என்று கற்றுக்கொள்ளுங்கள்',
    diseases: 'பயிர் நோய்கள்',
    pests: 'தீங்கு விளைவிக்கும் பூச்சிகள்',
    moreHelp: 'மேலும் உதவி வேண்டுமா?',
    moreHelpDesc: 'எங்கள் AI உதவியாளரிடமிருந்து தனிப்பயனாக்கப்பட்ட ஆலோசனை பெறுங்கள்',
    chatNow: 'AI உதவியாளருடன் அரட்டையடியுங்கள்',
    symptoms: 'அறிகுறிகள்',
    treatment: 'சிகிச்சை',
    prevention: 'தடுப்பு',
  },
  bn: {
    title: 'কীটপতঙ্গ ও রোগ গাইড',
    subtitle: 'সাধারণ হুমকি চিহ্নিত করুন এবং আপনার ফসল কীভাবে রক্ষা করবেন তা শিখুন',
    diseases: 'ফসলের রোগ',
    pests: 'ক্ষতিকারক পোকামাকড়',
    moreHelp: 'আরও সাহায্য দরকার?',
    moreHelpDesc: 'আমাদের AI সহায়ক থেকে ব্যক্তিগত পরামর্শ নিন',
    chatNow: 'AI সহায়কের সাথে চ্যাট করুন',
    symptoms: 'লক্ষণ',
    treatment: 'চিকিৎসা',
    prevention: 'প্রতিরোধ',
  },
};

// Common crop diseases with solutions
const diseases = [
  {
    id: 1,
    name: { en: 'Late Blight', hi: 'लेट ब्लाइट', mr: 'उशीरा करपा', te: 'ఆలస్య బ్లైట్', ta: 'தாமத வாடல்', bn: 'লেট ব্লাইট' },
    affectedCrops: ['Potato', 'Tomato'],
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
    symptoms: {
      en: 'Dark brown spots on leaves, white fungal growth underneath, rapid plant death',
      hi: 'पत्तियों पर गहरे भूरे धब्बे, नीचे सफेद कवक वृद्धि, तेजी से पौधे की मृत्यु',
    },
    treatment: {
      en: 'Apply Mancozeb 75% WP (2.5g/L) or Metalaxyl + Mancozeb (2g/L). Remove infected plants immediately.',
      hi: 'मैन्कोज़ेब 75% WP (2.5g/L) या मेटालैक्सिल + मैन्कोज़ेब (2g/L) लगाएं। संक्रमित पौधों को तुरंत हटाएं।',
    },
    prevention: {
      en: 'Use resistant varieties, ensure good drainage, avoid overhead irrigation, apply preventive fungicide sprays',
      hi: 'प्रतिरोधी किस्मों का उपयोग करें, अच्छी जल निकासी सुनिश्चित करें, ऊपरी सिंचाई से बचें, निवारक कवकनाशी स्प्रे करें',
    },
    severity: 'high',
  },
  {
    id: 2,
    name: { en: 'Powdery Mildew', hi: 'पाउडरी मिल्ड्यू', mr: 'भुरी', te: 'బూడిద తెగులు', ta: 'வெண்புள்ளி நோய்', bn: 'পাউডারি মিলডিউ' },
    affectedCrops: ['Wheat', 'Grapes', 'Cucumber', 'Peas'],
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
    symptoms: {
      en: 'White powdery coating on leaves, yellowing, curling of leaves, stunted growth',
      hi: 'पत्तियों पर सफेद पाउडर जैसी परत, पीलापन, पत्तियों का मुड़ना, रुकी हुई वृद्धि',
    },
    treatment: {
      en: 'Spray Sulphur 80% WP (3g/L) or Carbendazim 50% WP (1g/L). Apply neem oil (5ml/L) for organic control.',
      hi: 'सल्फर 80% WP (3g/L) या कार्बेंडाजिम 50% WP (1g/L) स्प्रे करें। जैविक नियंत्रण के लिए नीम तेल (5ml/L) लगाएं।',
    },
    prevention: {
      en: 'Maintain proper spacing for air circulation, avoid excess nitrogen fertilizer, use resistant varieties',
      hi: 'हवा के संचार के लिए उचित दूरी बनाए रखें, अधिक नाइट्रोजन उर्वरक से बचें, प्रतिरोधी किस्मों का उपयोग करें',
    },
    severity: 'medium',
  },
  {
    id: 3,
    name: { en: 'Bacterial Leaf Blight', hi: 'बैक्टीरियल लीफ ब्लाइट', mr: 'जीवाणूजन्य करपा', te: 'బాక్టీరియల్ ఆకు తెగులు', ta: 'பாக்டீரியா இலை வாடல்', bn: 'ব্যাকটেরিয়াল লিফ ব্লাইট' },
    affectedCrops: ['Rice', 'Cotton'],
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop',
    symptoms: {
      en: 'Water-soaked lesions on leaves, yellowing from tips, wilting, grayish streaks',
      hi: 'पत्तियों पर पानी भरे घाव, सिरों से पीलापन, मुरझाना, भूरे रंग की धारियां',
    },
    treatment: {
      en: 'Apply Streptocycline (1g/10L) + Copper oxychloride (3g/L). Drain excess water from fields.',
      hi: 'स्ट्रेप्टोसाइक्लिन (1g/10L) + कॉपर ऑक्सीक्लोराइड (3g/L) लगाएं। खेतों से अतिरिक्त पानी निकालें।',
    },
    prevention: {
      en: 'Use certified disease-free seeds, avoid high nitrogen, maintain field hygiene, balanced fertilization',
      hi: 'प्रमाणित रोग-मुक्त बीजों का उपयोग करें, अधिक नाइट्रोजन से बचें, खेत की स्वच्छता बनाए रखें, संतुलित उर्वरण करें',
    },
    severity: 'high',
  },
  {
    id: 4,
    name: { en: 'Rust Disease', hi: 'रस्ट रोग', mr: 'तांबेरा', te: 'తుప్పు వ్యాధి', ta: 'துரு நோய்', bn: 'মরিচা রোগ' },
    affectedCrops: ['Wheat', 'Maize', 'Sugarcane'],
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=300&fit=crop',
    symptoms: {
      en: 'Orange-brown pustules on leaves and stems, leaf drying, reduced grain filling',
      hi: 'पत्तियों और तनों पर नारंगी-भूरे दाने, पत्ती का सूखना, दाने का कम भरना',
    },
    treatment: {
      en: 'Spray Propiconazole 25% EC (1ml/L) or Tebuconazole 25.9% EC (1ml/L). Apply at first sign of infection.',
      hi: 'प्रोपिकोनाज़ोल 25% EC (1ml/L) या टेबुकोनाज़ोल 25.9% EC (1ml/L) स्प्रे करें। संक्रमण के पहले संकेत पर लगाएं।',
    },
    prevention: {
      en: 'Grow resistant varieties, early sowing, avoid late nitrogen application, destroy crop residues',
      hi: 'प्रतिरोधी किस्में उगाएं, जल्दी बुवाई करें, देर से नाइट्रोजन देने से बचें, फसल अवशेषों को नष्ट करें',
    },
    severity: 'high',
  },
];

// Common harmful pests with solutions
const pests = [
  {
    id: 1,
    name: { en: 'Stem Borer', hi: 'तना छेदक', mr: 'खोड किडा', te: 'కాండం తొలిచే పురుగు', ta: 'தண்டுத் துளைப்பான்', bn: 'কান্ড ছিদ্রকারী' },
    affectedCrops: ['Rice', 'Maize', 'Sugarcane'],
    image: stemBorerImage,
    damage: {
      en: 'Larvae bore into stems causing "dead heart" in young plants and "white ear" in mature plants',
      hi: 'लार्वा तनों में छेद करके युवा पौधों में "डेड हार्ट" और परिपक्व पौधों में "वाइट ईयर" का कारण बनता है',
    },
    treatment: {
      en: 'Apply Cartap hydrochloride 4G (25kg/ha) or spray Chlorantraniliprole 18.5% SC (0.3ml/L). Use pheromone traps.',
      hi: 'कार्टैप हाइड्रोक्लोराइड 4G (25kg/ha) लगाएं या क्लोरांट्रानिलिप्रोल 18.5% SC (0.3ml/L) स्प्रे करें। फेरोमोन ट्रैप का उपयोग करें।',
    },
    prevention: {
      en: 'Remove stubble after harvest, use light traps, release Trichogramma egg parasitoids, maintain field bunds clean',
      hi: 'फसल के बाद ठूंठ हटाएं, लाइट ट्रैप का उपयोग करें, ट्राइकोग्रामा अंड परजीवी छोड़ें, खेत की मेड़ों को साफ रखें',
    },
    severity: 'high',
  },
  {
    id: 2,
    name: { en: 'Aphids', hi: 'माहू', mr: 'मावा', te: 'పేను', ta: 'அசுவினி', bn: 'জাব পোকা' },
    affectedCrops: ['Mustard', 'Wheat', 'Vegetables', 'Cotton'],
    image: aphidsImage,
    damage: {
      en: 'Suck plant sap causing yellowing, curling leaves, stunted growth, and transmit viral diseases',
      hi: 'पौधे का रस चूसकर पीलापन, पत्तियों का मुड़ना, रुकी हुई वृद्धि और वायरल रोग फैलाते हैं',
    },
    treatment: {
      en: 'Spray Imidacloprid 17.8% SL (0.3ml/L) or Thiamethoxam 25% WG (0.3g/L). Neem oil (5ml/L) for organic farms.',
      hi: 'इमिडाक्लोप्रिड 17.8% SL (0.3ml/L) या थायमेथोक्साम 25% WG (0.3g/L) स्प्रे करें। जैविक खेतों के लिए नीम तेल (5ml/L)।',
    },
    prevention: {
      en: 'Encourage natural predators (ladybugs), use yellow sticky traps, avoid excess nitrogen, intercropping with coriander',
      hi: 'प्राकृतिक शिकारियों (लेडीबग) को प्रोत्साहित करें, पीले चिपचिपे जाल का उपयोग करें, अधिक नाइट्रोजन से बचें, धनिया के साथ अंतर फसल करें',
    },
    severity: 'medium',
  },
  {
    id: 3,
    name: { en: 'Bollworm', hi: 'बॉलवर्म', mr: 'बोंडअळी', te: 'కాయ తొలిచే పురుగు', ta: 'காய்ப்புழு', bn: 'বলওয়ার্ম' },
    affectedCrops: ['Cotton', 'Chickpea', 'Tomato', 'Okra'],
    image: bollwormImage,
    damage: {
      en: 'Larvae bore into bolls/fruits/pods causing shedding, rotting, and major yield loss (up to 50%)',
      hi: 'लार्वा बॉल/फल/फली में छेद करके गिरना, सड़न और बड़ी उपज हानि (50% तक) करते हैं',
    },
    treatment: {
      en: 'Spray Emamectin benzoate 5% SG (0.4g/L) or Spinosad 45% SC (0.3ml/L). Install pheromone traps at 5/ha.',
      hi: 'एमामेक्टिन बेंजोएट 5% SG (0.4g/L) या स्पिनोसैड 45% SC (0.3ml/L) स्प्रे करें। 5/हेक्टेयर पर फेरोमोन ट्रैप लगाएं।',
    },
    prevention: {
      en: 'Use Bt cotton varieties, install bird perches, release Trichogramma, grow trap crops (marigold), deep summer ploughing',
      hi: 'Bt कपास किस्मों का उपयोग करें, पक्षी बसेरा लगाएं, ट्राइकोग्रामा छोड़ें, ट्रैप फसलें (गेंदा) उगाएं, गहरी गर्मी की जुताई करें',
    },
    severity: 'high',
  },
  {
    id: 4,
    name: { en: 'Whitefly', hi: 'सफेद मक्खी', mr: 'पांढरी माशी', te: 'తెల్ల దోమ', ta: 'வெள்ளை ஈ', bn: 'সাদা মাছি' },
    affectedCrops: ['Cotton', 'Tomato', 'Brinjal', 'Chilli'],
    image: whiteflyImage,
    damage: {
      en: 'Suck sap causing leaf yellowing, sooty mold growth, transmit deadly viral diseases like leaf curl',
      hi: 'रस चूसकर पत्ती का पीलापन, काली फफूंद वृद्धि, लीफ कर्ल जैसी घातक वायरल बीमारियां फैलाते हैं',
    },
    treatment: {
      en: 'Spray Spiromesifen 22.9% SC (0.5ml/L) or Pyriproxyfen 10% EC (1ml/L). Use neem oil + yellow sticky traps.',
      hi: 'स्पाइरोमेसिफेन 22.9% SC (0.5ml/L) या पाइरीप्रोक्सीफेन 10% EC (1ml/L) स्प्रे करें। नीम तेल + पीले चिपचिपे जाल का उपयोग करें।',
    },
    prevention: {
      en: 'Avoid overlapping cropping, remove weed hosts, use reflective mulches, maintain crop-free period, destroy infected plants',
      hi: 'ओवरलैपिंग फसल से बचें, खरपतवार मेजबान हटाएं, परावर्तक मल्च का उपयोग करें, फसल-मुक्त अवधि बनाए रखें, संक्रमित पौधों को नष्ट करें',
    },
    severity: 'high',
  },
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'bg-destructive text-destructive-foreground';
    case 'medium':
      return 'bg-amber-500 text-white';
    case 'low':
      return 'bg-green-500 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const PestDisease = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [activeTab, setActiveTab] = useState('diseases');

  const getLocalizedText = (textObj: Record<string, string>) => {
    return textObj[language] || textObj.hi || textObj.en;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Header with pattern */}
        <div className="hero-pattern bg-gradient-to-b from-amber-500/10 to-background py-8 px-4">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900 mb-3">
              <Bug className="w-7 h-7 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="diseases" className="gap-2">
              <Leaf className="w-4 h-4" />
              {t.diseases}
            </TabsTrigger>
            <TabsTrigger value="pests" className="gap-2">
              <Bug className="w-4 h-4" />
              {t.pests}
            </TabsTrigger>
          </TabsList>

          {/* Diseases Tab */}
          <TabsContent value="diseases" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {diseases.map((disease) => (
                <Card key={disease.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative">
                    <img
                      src={disease.image}
                      alt={getLocalizedText(disease.name)}
                      className="w-full h-full object-cover"
                    />
                    <Badge className={`absolute top-3 right-3 ${getSeverityColor(disease.severity)}`}>
                      {disease.severity === 'high' ? '⚠️ High Risk' : disease.severity === 'medium' ? '⚡ Medium Risk' : '✓ Low Risk'}
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{getLocalizedText(disease.name)}</CardTitle>
                    <div className="flex flex-wrap gap-1">
                      {disease.affectedCrops.map((crop) => (
                        <Badge key={crop} variant="outline" className="text-xs">
                          {crop}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        {t.symptoms}
                      </div>
                      <p className="text-sm">{getLocalizedText(disease.symptoms)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-green-600 mb-1">
                        <Leaf className="w-4 h-4" />
                        {t.treatment}
                      </div>
                      <p className="text-sm">{getLocalizedText(disease.treatment)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-1">
                        <Shield className="w-4 h-4" />
                        {t.prevention}
                      </div>
                      <p className="text-sm">{getLocalizedText(disease.prevention)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Pests Tab */}
          <TabsContent value="pests" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pests.map((pest) => (
                <Card key={pest.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative">
                    <img
                      src={pest.image}
                      alt={getLocalizedText(pest.name)}
                      className="w-full h-full object-cover"
                    />
                    <Badge className={`absolute top-3 right-3 ${getSeverityColor(pest.severity)}`}>
                      {pest.severity === 'high' ? '⚠️ High Risk' : pest.severity === 'medium' ? '⚡ Medium Risk' : '✓ Low Risk'}
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{getLocalizedText(pest.name)}</CardTitle>
                    <div className="flex flex-wrap gap-1">
                      {pest.affectedCrops.map((crop) => (
                        <Badge key={crop} variant="outline" className="text-xs">
                          {crop}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        Damage
                      </div>
                      <p className="text-sm">{getLocalizedText(pest.damage)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-green-600 mb-1">
                        <Leaf className="w-4 h-4" />
                        {t.treatment}
                      </div>
                      <p className="text-sm">{getLocalizedText(pest.treatment)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-1">
                        <Shield className="w-4 h-4" />
                        {t.prevention}
                      </div>
                      <p className="text-sm">{getLocalizedText(pest.prevention)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <section className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 mb-3">
            <MessageCircle className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t.moreHelp}</h2>
          <p className="text-muted-foreground text-sm mb-4">{t.moreHelpDesc}</p>
          <Button
            size="default"
            onClick={() => navigate('/chat')}
            className="gap-2"
          >
            {t.chatNow}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PestDisease;
