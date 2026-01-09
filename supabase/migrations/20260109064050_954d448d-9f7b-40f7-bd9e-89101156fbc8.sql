-- Crops reference table
CREATE TABLE public.crops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_hi TEXT,
  name_mr TEXT,
  name_te TEXT,
  name_ta TEXT,
  name_bn TEXT,
  description_en TEXT,
  description_hi TEXT,
  season TEXT,
  region TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pests reference table
CREATE TABLE public.pests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_hi TEXT,
  name_mr TEXT,
  name_te TEXT,
  name_ta TEXT,
  name_bn TEXT,
  description_en TEXT,
  description_hi TEXT,
  affected_crops TEXT[],
  treatment_en TEXT,
  treatment_hi TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Government schemes table
CREATE TABLE public.schemes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_hi TEXT,
  name_mr TEXT,
  name_te TEXT,
  name_ta TEXT,
  name_bn TEXT,
  category TEXT NOT NULL CHECK (category IN ('farmers', 'women', 'students', 'rural_workers')),
  state TEXT,
  benefits_en TEXT,
  benefits_hi TEXT,
  eligibility_en TEXT,
  eligibility_hi TEXT,
  documents_en TEXT[],
  documents_hi TEXT[],
  how_to_apply_en TEXT,
  how_to_apply_hi TEXT,
  official_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat history for users (optional, no auth required initially)
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Public read access for reference data
CREATE POLICY "Public read access for crops" ON public.crops FOR SELECT USING (true);
CREATE POLICY "Public read access for pests" ON public.pests FOR SELECT USING (true);
CREATE POLICY "Public read access for schemes" ON public.schemes FOR SELECT USING (true);

-- Chat sessions and messages are public for now (no auth required)
CREATE POLICY "Public access for chat_sessions" ON public.chat_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_schemes_updated_at
  BEFORE UPDATE ON public.schemes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for crops
INSERT INTO public.crops (name_en, name_hi, season, region, description_en, description_hi) VALUES
('Rice', 'चावल', 'kharif', ARRAY['West Bengal', 'Uttar Pradesh', 'Punjab', 'Tamil Nadu'], 'Staple cereal crop requiring flooded conditions', 'बाढ़ वाली स्थिति में उगाई जाने वाली मुख्य अनाज फसल'),
('Wheat', 'गेहूं', 'rabi', ARRAY['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh'], 'Major winter crop in northern India', 'उत्तर भारत में प्रमुख सर्दियों की फसल'),
('Cotton', 'कपास', 'kharif', ARRAY['Gujarat', 'Maharashtra', 'Telangana', 'Andhra Pradesh'], 'Important cash crop for textile industry', 'कपड़ा उद्योग के लिए महत्वपूर्ण नकदी फसल'),
('Sugarcane', 'गन्ना', 'annual', ARRAY['Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu'], 'Tropical crop used for sugar production', 'चीनी उत्पादन के लिए उपयोग की जाने वाली उष्णकटिबंधीय फसल'),
('Potato', 'आलू', 'rabi', ARRAY['Uttar Pradesh', 'West Bengal', 'Bihar', 'Gujarat'], 'Root vegetable grown in cooler months', 'ठंडे महीनों में उगाई जाने वाली कंद सब्जी');

-- Insert sample data for pests
INSERT INTO public.pests (name_en, name_hi, affected_crops, treatment_en, treatment_hi, description_en, description_hi) VALUES
('Brown Planthopper', 'भूरा फुदका', ARRAY['Rice'], 'Use resistant varieties, avoid excess nitrogen', 'प्रतिरोधी किस्मों का उपयोग करें, अधिक नाइट्रोजन से बचें', 'Major pest of rice causing hopper burn', 'चावल का प्रमुख कीट जो हॉपर बर्न का कारण बनता है'),
('Cotton Bollworm', 'कपास का बॉलवर्म', ARRAY['Cotton'], 'Bt cotton, pheromone traps, neem-based pesticides', 'बीटी कॉटन, फेरोमोन जाल, नीम आधारित कीटनाशक', 'Larva damages cotton bolls', 'लार्वा कपास के बॉल को नुकसान पहुंचाता है'),
('Aphids', 'मोयला', ARRAY['Wheat', 'Cotton', 'Potato'], 'Neem oil spray, ladybird beetles as biocontrol', 'नीम तेल स्प्रे, लेडीबर्ड बीटल जैव नियंत्रण के रूप में', 'Small sap-sucking insects', 'छोटे रस चूसने वाले कीड़े'),
('Fall Armyworm', 'फॉल आर्मीवर्म', ARRAY['Maize', 'Rice', 'Sugarcane'], 'Early detection, spinosad or chlorantraniliprole', 'जल्द पता लगाना, स्पिनोसैड या क्लोरेंट्रानिलिप्रोल', 'Invasive pest attacking multiple crops', 'कई फसलों पर हमला करने वाला आक्रामक कीट');

-- Insert sample government schemes
INSERT INTO public.schemes (name_en, name_hi, category, state, benefits_en, benefits_hi, eligibility_en, eligibility_hi, documents_en, documents_hi, how_to_apply_en, how_to_apply_hi, official_link) VALUES
('PM-KISAN', 'पीएम-किसान', 'farmers', NULL, 'Rs. 6000 per year in 3 installments', 'प्रति वर्ष 3 किस्तों में 6000 रुपये', 'All farmer families with cultivable land', 'खेती योग्य भूमि वाले सभी किसान परिवार', ARRAY['Aadhaar Card', 'Land Records', 'Bank Account'], ARRAY['आधार कार्ड', 'भूमि रिकॉर्ड', 'बैंक खाता'], 'Apply through Common Service Centre or official website', 'कॉमन सर्विस सेंटर या आधिकारिक वेबसाइट के माध्यम से आवेदन करें', 'https://pmkisan.gov.in'),
('Kisan Credit Card', 'किसान क्रेडिट कार्ड', 'farmers', NULL, 'Low interest loans for farming needs', 'खेती की जरूरतों के लिए कम ब्याज वाले ऋण', 'Farmers, sharecroppers, tenant farmers', 'किसान, बटाईदार, किरायेदार किसान', ARRAY['Identity Proof', 'Land Documents', 'Passport Photo'], ARRAY['पहचान प्रमाण', 'भूमि दस्तावेज', 'पासपोर्ट फोटो'], 'Apply at nearest bank branch', 'निकटतम बैंक शाखा में आवेदन करें', 'https://www.nabard.org'),
('Beti Bachao Beti Padhao', 'बेटी बचाओ बेटी पढ़ाओ', 'women', NULL, 'Awareness and welfare schemes for girl child', 'बालिकाओं के लिए जागरूकता और कल्याण योजनाएं', 'Families with girl children', 'बालिकाओं वाले परिवार', ARRAY['Birth Certificate', 'Aadhaar Card'], ARRAY['जन्म प्रमाण पत्र', 'आधार कार्ड'], 'Contact Anganwadi or district office', 'आंगनवाड़ी या जिला कार्यालय से संपर्क करें', 'https://wcd.nic.in'),
('National Scholarship Portal', 'राष्ट्रीय छात्रवृत्ति पोर्टल', 'students', NULL, 'Various scholarships for students', 'छात्रों के लिए विभिन्न छात्रवृत्तियां', 'Students from Class 1 to Post-Doctoral level', 'कक्षा 1 से पोस्ट-डॉक्टरल स्तर तक के छात्र', ARRAY['Income Certificate', 'Marksheet', 'Bank Account'], ARRAY['आय प्रमाण पत्र', 'मार्कशीट', 'बैंक खाता'], 'Register on National Scholarship Portal', 'राष्ट्रीय छात्रवृत्ति पोर्टल पर पंजीकरण करें', 'https://scholarships.gov.in'),
('MGNREGA', 'मनरेगा', 'rural_workers', NULL, '100 days guaranteed wage employment per year', 'प्रति वर्ष 100 दिनों की गारंटीशुदा मजदूरी रोजगार', 'Adult members of rural households', 'ग्रामीण परिवारों के वयस्क सदस्य', ARRAY['Job Card', 'Aadhaar Card', 'Bank Account'], ARRAY['जॉब कार्ड', 'आधार कार्ड', 'बैंक खाता'], 'Register at Gram Panchayat office', 'ग्राम पंचायत कार्यालय में पंजीकरण करें', 'https://nrega.nic.in');