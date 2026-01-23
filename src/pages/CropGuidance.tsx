import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Droplets, Sun, ThermometerSun, Wind, Leaf, ArrowRight, MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const translations = {
  en: {
    title: 'Crop Guidance',
    subtitle: 'Learn the basics of successful farming',
    keyParameters: 'Key Farming Parameters',
    basicTips: 'Basic Growing Tips',
    askExpert: 'Ask Our Expert',
    askExpertDesc: 'Have specific questions about your crops?',
    chatNow: 'Chat with AI Assistant',
    // Key Parameters
    soilHealth: 'Soil Health',
    soilHealthDesc: 'Test soil pH (6.0-7.0 ideal), check organic matter content, ensure proper drainage',
    waterManagement: 'Water Management',
    waterManagementDesc: 'Irrigate based on crop stage, use drip irrigation to save 30-50% water',
    sunlight: 'Sunlight',
    sunlightDesc: 'Most crops need 6-8 hours of direct sunlight daily for optimal growth',
    temperature: 'Temperature',
    temperatureDesc: 'Monitor day/night temperature differences, protect crops from frost',
    wind: 'Wind Protection',
    windDesc: 'Use windbreaks to prevent crop damage, especially for young plants',
    nutrients: 'Nutrients',
    nutrientsDesc: 'NPK ratio varies by crop - use soil tests to guide fertilizer application',
    // Basic Tips
    tip1Title: 'Seed Selection',
    tip1Desc: 'Choose certified seeds from trusted sources. Select varieties suited to your region and season.',
    tip2Title: 'Land Preparation',
    tip2Desc: 'Plough 2-3 times, remove weeds, add organic matter like cow dung or compost.',
    tip3Title: 'Sowing Time',
    tip3Desc: 'Follow regional crop calendars. Kharif: June-July, Rabi: October-November, Zaid: March-April.',
    tip4Title: 'Spacing',
    tip4Desc: 'Maintain proper plant-to-plant and row-to-row spacing for air circulation and growth.',
    tip5Title: 'Mulching',
    tip5Desc: 'Use straw or crop residue as mulch to retain moisture and suppress weeds.',
    tip6Title: 'Crop Rotation',
    tip6Desc: 'Rotate crops each season to maintain soil fertility and break pest cycles.',
  },
  hi: {
    title: 'फसल मार्गदर्शन',
    subtitle: 'सफल खेती की मूल बातें सीखें',
    keyParameters: 'खेती के मुख्य पैरामीटर',
    basicTips: 'बुनियादी उगाने के टिप्स',
    askExpert: 'विशेषज्ञ से पूछें',
    askExpertDesc: 'अपनी फसलों के बारे में विशेष प्रश्न हैं?',
    chatNow: 'AI सहायक से चैट करें',
    soilHealth: 'मिट्टी का स्वास्थ्य',
    soilHealthDesc: 'मिट्टी का pH परीक्षण करें (6.0-7.0 आदर्श), जैविक पदार्थ की जांच करें, उचित जल निकासी सुनिश्चित करें',
    waterManagement: 'जल प्रबंधन',
    waterManagementDesc: 'फसल चरण के अनुसार सिंचाई करें, 30-50% पानी बचाने के लिए ड्रिप सिंचाई का उपयोग करें',
    sunlight: 'धूप',
    sunlightDesc: 'अधिकांश फसलों को इष्टतम विकास के लिए प्रतिदिन 6-8 घंटे सीधी धूप की आवश्यकता होती है',
    temperature: 'तापमान',
    temperatureDesc: 'दिन/रात के तापमान अंतर की निगरानी करें, फसलों को पाले से बचाएं',
    wind: 'हवा से सुरक्षा',
    windDesc: 'फसल क्षति को रोकने के लिए विंडब्रेक का उपयोग करें, विशेषकर युवा पौधों के लिए',
    nutrients: 'पोषक तत्व',
    nutrientsDesc: 'NPK अनुपात फसल के अनुसार बदलता है - उर्वरक आवेदन के लिए मिट्टी परीक्षण का उपयोग करें',
    tip1Title: 'बीज चयन',
    tip1Desc: 'विश्वसनीय स्रोतों से प्रमाणित बीज चुनें। अपने क्षेत्र और मौसम के अनुकूल किस्में चुनें।',
    tip2Title: 'भूमि की तैयारी',
    tip2Desc: '2-3 बार जुताई करें, खरपतवार हटाएं, गोबर या कम्पोस्ट जैसे जैविक पदार्थ मिलाएं।',
    tip3Title: 'बुवाई का समय',
    tip3Desc: 'क्षेत्रीय फसल कैलेंडर का पालन करें। खरीफ: जून-जुलाई, रबी: अक्टूबर-नवंबर, जायद: मार्च-अप्रैल।',
    tip4Title: 'दूरी',
    tip4Desc: 'हवा के संचार और विकास के लिए उचित पौधे से पौधे और पंक्ति से पंक्ति की दूरी बनाए रखें।',
    tip5Title: 'मल्चिंग',
    tip5Desc: 'नमी बनाए रखने और खरपतवार को दबाने के लिए पुआल या फसल अवशेष का उपयोग करें।',
    tip6Title: 'फसल चक्र',
    tip6Desc: 'मिट्टी की उर्वरता बनाए रखने और कीट चक्र को तोड़ने के लिए हर मौसम में फसलों को घुमाएं।',
  },
  mr: {
    title: 'पीक मार्गदर्शन',
    subtitle: 'यशस्वी शेतीची मूलभूत माहिती शिका',
    keyParameters: 'शेतीचे मुख्य घटक',
    basicTips: 'मूलभूत वाढवण्याच्या टिप्स',
    askExpert: 'तज्ञांना विचारा',
    askExpertDesc: 'तुमच्या पिकांबद्दल विशिष्ट प्रश्न आहेत?',
    chatNow: 'AI सहाय्यकाशी चॅट करा',
    soilHealth: 'मातीचे आरोग्य',
    soilHealthDesc: 'मातीचा pH तपासा (6.0-7.0 आदर्श), सेंद्रिय पदार्थ तपासा, योग्य निचरा सुनिश्चित करा',
    waterManagement: 'पाणी व्यवस्थापन',
    waterManagementDesc: 'पीक टप्प्यानुसार सिंचन करा, 30-50% पाणी वाचवण्यासाठी ठिबक सिंचन वापरा',
    sunlight: 'सूर्यप्रकाश',
    sunlightDesc: 'बहुतेक पिकांना उत्तम वाढीसाठी दररोज 6-8 तास थेट सूर्यप्रकाश लागतो',
    temperature: 'तापमान',
    temperatureDesc: 'दिवस/रात्र तापमान फरक निरीक्षण करा, पिकांना दंव पासून संरक्षण द्या',
    wind: 'वारा संरक्षण',
    windDesc: 'पीक नुकसान टाळण्यासाठी वारा अडथळे वापरा, विशेषतः लहान रोपांसाठी',
    nutrients: 'पोषक तत्वे',
    nutrientsDesc: 'NPK प्रमाण पिकानुसार बदलते - खत वापरासाठी माती परीक्षण वापरा',
    tip1Title: 'बियाणे निवड',
    tip1Desc: 'विश्वासार्ह स्रोतांकडून प्रमाणित बियाणे निवडा. तुमच्या प्रदेश आणि हंगामासाठी योग्य वाण निवडा.',
    tip2Title: 'जमीन तयारी',
    tip2Desc: '2-3 वेळा नांगरणी करा, तण काढा, शेणखत किंवा कंपोस्ट सारखे सेंद्रिय पदार्थ घाला.',
    tip3Title: 'पेरणीची वेळ',
    tip3Desc: 'प्रादेशिक पीक कॅलेंडरचे अनुसरण करा. खरीप: जून-जुलै, रबी: ऑक्टोबर-नोव्हेंबर, झायद: मार्च-एप्रिल.',
    tip4Title: 'अंतर',
    tip4Desc: 'हवा खेळती आणि वाढीसाठी योग्य रोप ते रोप आणि ओळ ते ओळ अंतर ठेवा.',
    tip5Title: 'आच्छादन',
    tip5Desc: 'ओलावा टिकवण्यासाठी आणि तण दाबण्यासाठी पेंढा किंवा पीक अवशेष आच्छादन म्हणून वापरा.',
    tip6Title: 'पीक फेरपालट',
    tip6Desc: 'जमिनीची सुपीकता टिकवण्यासाठी आणि कीटक चक्र मोडण्यासाठी दर हंगामात पिके बदला.',
  },
  te: {
    title: 'పంట మార్గదర్శకత్వం',
    subtitle: 'విజయవంతమైన వ్యవసాయం యొక్క ప్రాథమిక అంశాలను నేర్చుకోండి',
    keyParameters: 'ముఖ్యమైన వ్యవసాయ పారామీటర్లు',
    basicTips: 'ప్రాథమిక పెంపకం చిట్కాలు',
    askExpert: 'నిపుణుడిని అడగండి',
    askExpertDesc: 'మీ పంటల గురించి నిర్దిష్ట ప్రశ్నలు ఉన్నాయా?',
    chatNow: 'AI సహాయకుడితో చాట్ చేయండి',
    soilHealth: 'నేల ఆరోగ్యం',
    soilHealthDesc: 'నేల pH పరీక్షించండి (6.0-7.0 ఆదర్శం), సేంద్రియ పదార్థాలను తనిఖీ చేయండి, సరైన నీటి పారుదల నిర్ధారించండి',
    waterManagement: 'నీటి నిర్వహణ',
    waterManagementDesc: 'పంట దశ ప్రకారం నీరు పెట్టండి, 30-50% నీరు ఆదా చేయడానికి బిందు సేద్యం వాడండి',
    sunlight: 'సూర్యకాంతి',
    sunlightDesc: 'చాలా పంటలకు ఉత్తమ వృద్ధికి రోజుకు 6-8 గంటల ప్రత్యక్ష సూర్యకాంతి అవసరం',
    temperature: 'ఉష్ణోగ్రత',
    temperatureDesc: 'పగటి/రాత్రి ఉష్ణోగ్రత తేడాలను పర్యవేక్షించండి, పంటలను మంచు నుండి రక్షించండి',
    wind: 'గాలి రక్షణ',
    windDesc: 'పంట నష్టాన్ని నివారించడానికి గాలి అడ్డుకట్టలు వాడండి, ముఖ్యంగా చిన్న మొక్కలకు',
    nutrients: 'పోషకాలు',
    nutrientsDesc: 'NPK నిష్పత్తి పంట ప్రకారం మారుతుంది - ఎరువుల వాడకానికి నేల పరీక్షలు చేయండి',
    tip1Title: 'విత్తన ఎంపిక',
    tip1Desc: 'నమ్మకమైన వనరుల నుండి ధృవీకరించబడిన విత్తనాలను ఎంచుకోండి. మీ ప్రాంతం మరియు సీజన్‌కు తగిన రకాలను ఎంచుకోండి.',
    tip2Title: 'భూమి సిద్ధం',
    tip2Desc: '2-3 సార్లు దున్నండి, కలుపు తీసేయండి, పేడ లేదా కంపోస్ట్ వంటి సేంద్రియ పదార్థం కలపండి.',
    tip3Title: 'విత్తే సమయం',
    tip3Desc: 'ప్రాంతీయ పంట క్యాలెండర్‌ను అనుసరించండి. ఖరీఫ్: జూన్-జులై, రబీ: అక్టోబర్-నవంబర్, జాయిద్: మార్చి-ఏప్రిల్.',
    tip4Title: 'దూరం',
    tip4Desc: 'గాలి ప్రసరణ మరియు వృద్ధి కోసం మొక్క నుండి మొక్కకు మరియు వరుస నుండి వరుసకు సరైన దూరం పాటించండి.',
    tip5Title: 'మల్చింగ్',
    tip5Desc: 'తేమను నిలుపుకోవడానికి మరియు కలుపును అణచడానికి గడ్డి లేదా పంట అవశేషాలను మల్చ్‌గా వాడండి.',
    tip6Title: 'పంట మార్పిడి',
    tip6Desc: 'నేల సారాన్ని నిలబెట్టడానికి మరియు తెగులు చక్రాన్ని విచ్ఛిన్నం చేయడానికి ప్రతి సీజన్‌లో పంటలను మార్చండి.',
  },
  ta: {
    title: 'பயிர் வழிகாட்டல்',
    subtitle: 'வெற்றிகரமான விவசாயத்தின் அடிப்படைகளைக் கற்றுக்கொள்ளுங்கள்',
    keyParameters: 'முக்கிய விவசாய அளவுருக்கள்',
    basicTips: 'அடிப்படை வளர்ப்பு குறிப்புகள்',
    askExpert: 'நிபுணரிடம் கேளுங்கள்',
    askExpertDesc: 'உங்கள் பயிர்களைப் பற்றி குறிப்பிட்ட கேள்விகள் உள்ளதா?',
    chatNow: 'AI உதவியாளருடன் அரட்டையடியுங்கள்',
    soilHealth: 'மண் ஆரோக்கியம்',
    soilHealthDesc: 'மண் pH சோதிக்கவும் (6.0-7.0 சிறந்தது), கரிமப் பொருட்களைச் சரிபார்க்கவும், சரியான வடிகால் உறுதிசெய்யவும்',
    waterManagement: 'நீர் மேலாண்மை',
    waterManagementDesc: 'பயிர் நிலைக்கேற்ப நீர்ப்பாசனம் செய்யுங்கள், 30-50% நீர் சேமிக்க சொட்டு நீர்ப்பாசனம் பயன்படுத்துங்கள்',
    sunlight: 'சூரிய ஒளி',
    sunlightDesc: 'பெரும்பாலான பயிர்களுக்கு சிறந்த வளர்ச்சிக்கு தினமும் 6-8 மணி நேர நேரடி சூரிய ஒளி தேவை',
    temperature: 'வெப்பநிலை',
    temperatureDesc: 'பகல்/இரவு வெப்பநிலை வேறுபாடுகளைக் கண்காணிக்கவும், பயிர்களை உறைபனியிலிருந்து பாதுகாக்கவும்',
    wind: 'காற்று பாதுகாப்பு',
    windDesc: 'பயிர் சேதத்தைத் தடுக்க காற்றுத்தடுப்புகளைப் பயன்படுத்துங்கள், குறிப்பாக இளம் செடிகளுக்கு',
    nutrients: 'ஊட்டச்சத்துக்கள்',
    nutrientsDesc: 'NPK விகிதம் பயிருக்கேற்ப மாறுபடும் - உர பயன்பாட்டிற்கு மண் சோதனைகளைப் பயன்படுத்துங்கள்',
    tip1Title: 'விதை தேர்வு',
    tip1Desc: 'நம்பகமான மூலங்களிலிருந்து சான்றளிக்கப்பட்ட விதைகளைத் தேர்ந்தெடுக்கவும். உங்கள் பகுதி மற்றும் பருவத்திற்கு ஏற்ற ரகங்களைத் தேர்ந்தெடுக்கவும்.',
    tip2Title: 'நில தயாரிப்பு',
    tip2Desc: '2-3 முறை உழவு செய்யுங்கள், களைகளை அகற்றுங்கள், சாணம் அல்லது உரம் போன்ற கரிமப் பொருட்களைச் சேர்க்கவும்.',
    tip3Title: 'விதைப்பு நேரம்',
    tip3Desc: 'பிராந்திய பயிர் காலண்டரைப் பின்பற்றுங்கள். காரிஃப்: ஜூன்-ஜூலை, ரபி: அக்டோபர்-நவம்பர், சையித்: மார்ச்-ஏப்ரல்.',
    tip4Title: 'இடைவெளி',
    tip4Desc: 'காற்றோட்டம் மற்றும் வளர்ச்சிக்கு செடிக்கு செடி மற்றும் வரிசைக்கு வரிசை சரியான இடைவெளியை பராமரிக்கவும்.',
    tip5Title: 'மல்ச்சிங்',
    tip5Desc: 'ஈரப்பதத்தைத் தக்கவைக்கவும் களைகளை அடக்கவும் வைக்கோல் அல்லது பயிர் எச்சங்களை மல்ச்சாகப் பயன்படுத்துங்கள்.',
    tip6Title: 'பயிர் சுழற்சி',
    tip6Desc: 'மண் வளத்தை பராமரிக்கவும் பூச்சி சுழற்சிகளை உடைக்கவும் ஒவ்வொரு பருவத்திலும் பயிர்களை மாற்றுங்கள்.',
  },
  bn: {
    title: 'ফসল নির্দেশিকা',
    subtitle: 'সফল চাষের মূল বিষয়গুলি শিখুন',
    keyParameters: 'চাষের মূল পরামিতি',
    basicTips: 'মৌলিক চাষের টিপস',
    askExpert: 'বিশেষজ্ঞকে জিজ্ঞাসা করুন',
    askExpertDesc: 'আপনার ফসল সম্পর্কে নির্দিষ্ট প্রশ্ন আছে?',
    chatNow: 'AI সহায়কের সাথে চ্যাট করুন',
    soilHealth: 'মাটির স্বাস্থ্য',
    soilHealthDesc: 'মাটির pH পরীক্ষা করুন (6.0-7.0 আদর্শ), জৈব পদার্থ পরীক্ষা করুন, সঠিক নিষ্কাশন নিশ্চিত করুন',
    waterManagement: 'জল ব্যবস্থাপনা',
    waterManagementDesc: 'ফসলের পর্যায় অনুযায়ী সেচ দিন, 30-50% জল বাঁচাতে ড্রিপ সেচ ব্যবহার করুন',
    sunlight: 'সূর্যালোক',
    sunlightDesc: 'বেশিরভাগ ফসলের সর্বোত্তম বৃদ্ধির জন্য প্রতিদিন 6-8 ঘন্টা সরাসরি সূর্যালোক প্রয়োজন',
    temperature: 'তাপমাত্রা',
    temperatureDesc: 'দিন/রাতের তাপমাত্রার পার্থক্য পর্যবেক্ষণ করুন, তুষারপাত থেকে ফসল রক্ষা করুন',
    wind: 'বাতাস সুরক্ষা',
    windDesc: 'ফসলের ক্ষতি রোধ করতে উইন্ডব্রেক ব্যবহার করুন, বিশেষত তরুণ গাছের জন্য',
    nutrients: 'পুষ্টি উপাদান',
    nutrientsDesc: 'NPK অনুপাত ফসল অনুযায়ী পরিবর্তিত হয় - সার প্রয়োগের জন্য মাটি পরীক্ষা ব্যবহার করুন',
    tip1Title: 'বীজ নির্বাচন',
    tip1Desc: 'বিশ্বস্ত উৎস থেকে প্রত্যয়িত বীজ বেছে নিন। আপনার অঞ্চল এবং মরসুমের জন্য উপযুক্ত জাত নির্বাচন করুন।',
    tip2Title: 'জমি প্রস্তুতি',
    tip2Desc: '2-3 বার চাষ করুন, আগাছা সরান, গোবর বা কম্পোস্টের মতো জৈব পদার্থ যোগ করুন।',
    tip3Title: 'বপনের সময়',
    tip3Desc: 'আঞ্চলিক ফসল ক্যালেন্ডার অনুসরণ করুন। খারিফ: জুন-জুলাই, রবি: অক্টোবর-নভেম্বর, জায়েদ: মার্চ-এপ্রিল।',
    tip4Title: 'দূরত্ব',
    tip4Desc: 'বায়ু চলাচল এবং বৃদ্ধির জন্য গাছ থেকে গাছ এবং সারি থেকে সারিতে সঠিক দূরত্ব বজায় রাখুন।',
    tip5Title: 'মালচিং',
    tip5Desc: 'আর্দ্রতা ধরে রাখতে এবং আগাছা দমন করতে খড় বা ফসলের অবশিষ্টাংশ মালচ হিসাবে ব্যবহার করুন।',
    tip6Title: 'ফসল আবর্তন',
    tip6Desc: 'মাটির উর্বরতা বজায় রাখতে এবং কীটপতঙ্গ চক্র ভাঙতে প্রতি মরসুমে ফসল পরিবর্তন করুন।',
  },
};

const CropGuidance = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  const keyParameters = [
    { icon: Leaf, title: t.soilHealth, description: t.soilHealthDesc, color: 'bg-amber-500' },
    { icon: Droplets, title: t.waterManagement, description: t.waterManagementDesc, color: 'bg-blue-500' },
    { icon: Sun, title: t.sunlight, description: t.sunlightDesc, color: 'bg-yellow-500' },
    { icon: ThermometerSun, title: t.temperature, description: t.temperatureDesc, color: 'bg-orange-500' },
    { icon: Wind, title: t.wind, description: t.windDesc, color: 'bg-teal-500' },
    { icon: Sprout, title: t.nutrients, description: t.nutrientsDesc, color: 'bg-green-500' },
  ];

  const basicTips = [
    { title: t.tip1Title, description: t.tip1Desc },
    { title: t.tip2Title, description: t.tip2Desc },
    { title: t.tip3Title, description: t.tip3Desc },
    { title: t.tip4Title, description: t.tip4Desc },
    { title: t.tip5Title, description: t.tip5Desc },
    { title: t.tip6Title, description: t.tip6Desc },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <Sprout className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t.title}</h1>
          <p className="text-muted-foreground text-lg">{t.subtitle}</p>
        </div>

        {/* Key Parameters */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">{t.keyParameters}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {keyParameters.map((param, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${param.color}`}>
                      <param.icon className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{param.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {param.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Basic Tips */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">{t.basicTips}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {basicTips.map((tip, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </span>
                    {tip.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {tip.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Ask Expert CTA */}
        <section className="bg-gradient-to-r from-primary/10 to-green-500/10 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 mb-4">
            <MessageCircle className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{t.askExpert}</h2>
          <p className="text-muted-foreground mb-6">{t.askExpertDesc}</p>
          <Button 
            size="lg" 
            onClick={() => navigate('/chat')}
            className="gap-2"
          >
            {t.chatNow}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CropGuidance;
