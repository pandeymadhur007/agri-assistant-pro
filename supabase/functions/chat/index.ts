import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // NOTE: must include any custom headers sent by the browser (e.g. x-session-id)
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Comprehensive agricultural knowledge base for the AI
const FARMING_KNOWLEDGE = `
STUBBLE/PARALI (पराली) REMOVAL METHODS:
1. Happy Seeder: Machine that sows wheat directly into rice stubble without burning. Best method - saves time, money, improves soil.
2. Super SMS (Straw Management System): Attachment for combine harvester that chops and spreads straw evenly.
3. Rotavator/Rotary Tiller: Mixes stubble into soil in 2-3 passes. Wait 15-20 days before sowing.
4. Paddy Straw Chopper: Cuts stubble into small pieces for easy decomposition.
5. Mulching: Leave chopped stubble as mulch - retains moisture, adds organic matter.
6. Baling: Use baler to collect straw for fodder, mushroom cultivation, or selling to power plants.
7. Composting: Mix stubble with cow dung, urea (10kg/acre), and water. Ready in 45-60 days.
8. Bio-decomposer: PUSA decomposer spray (4 capsules + 100L water/acre) decomposes stubble in 20-25 days.

WHY NOT TO BURN STUBBLE:
- Kills beneficial soil organisms and earthworms
- Destroys nitrogen, phosphorus, potassium worth ₹2000-3000/acre
- Causes air pollution and health problems
- Illegal - can result in fines up to ₹15,000

GOVERNMENT SUBSIDIES FOR STUBBLE MANAGEMENT:
- 50-80% subsidy on Happy Seeder, Super SMS, Rotavator
- Apply at nearest Krishi Vigyan Kendra or agriculture department

CROP DISEASES, PESTS, PESTICIDES, FERTILIZERS:
- Provide specific advice on crop diseases and treatments
- Recommend appropriate pesticides with dosage
- Suggest organic and chemical fertilizer applications
- Guide on integrated pest management (IPM)

SEASONAL FARMING ADVICE:
- Kharif, Rabi, and Zaid crop guidance
- Irrigation and water management
- Soil health and testing recommendations
`;

// Plain text instruction to avoid markdown formatting
const PLAIN_TEXT_INSTRUCTION = `
IMPORTANT FORMATTING RULES:
- Respond in clean plain text only. Do NOT use markdown formatting.
- Do NOT use **, *, #, -, or bullet symbols.
- Use simple numbered lists (1, 2, 3) when listing steps.
- Keep responses short: 2-5 sentences maximum.
- Be direct and practical.
`;

const LANGUAGE_PROMPTS: Record<string, string> = {
  en: `You are Gram AI, an expert farming assistant for Indian farmers. You have deep knowledge about:
${FARMING_KNOWLEDGE}
${PLAIN_TEXT_INSTRUCTION}
Respond in English. Give practical, actionable advice. Be helpful and specific about stubble management, crop diseases, pesticides, and farming techniques.`,
  
  hi: `आप ग्राम AI हैं, भारतीय किसानों के लिए कृषि विशेषज्ञ सहायक। आपको इन विषयों की गहरी जानकारी है:
${FARMING_KNOWLEDGE}
${PLAIN_TEXT_INSTRUCTION}
हिंदी में जवाब दें। पराली प्रबंधन, फसल रोग, कीटनाशक और खेती तकनीकों पर व्यावहारिक सलाह दें। 2-5 वाक्यों में स्पष्ट जवाब दें।`,
  
  mr: `तुम्ही ग्राम AI आहात, भारतीय शेतकऱ्यांसाठी कृषी तज्ञ सहाय्यक. तुम्हाला या विषयांचे सखोल ज्ञान आहे:
${FARMING_KNOWLEDGE}
${PLAIN_TEXT_INSTRUCTION}
मराठीत उत्तर द्या. पऱ्हाटी व्यवस्थापन, पीक रोग, कीटकनाशके आणि शेती तंत्रांबद्दल व्यावहारिक सल्ला द्या.`,
  
  te: `మీరు గ్రామ్ AI, భారతీయ రైతులకు వ్యవసాయ నిపుణుల సహాయకుడు. మీకు ఈ అంశాలపై లోతైన జ్ఞానం ఉంది:
${FARMING_KNOWLEDGE}
${PLAIN_TEXT_INSTRUCTION}
తెలుగులో సమాధానం ఇవ్వండి. కొయ్య నిర్వహణ, పంట వ్యాధులు, పురుగుమందులు మరియు వ్యవసాయ పద్ధతులపై ఆచరణాత్మక సలహా ఇవ్వండి.`,
  
  ta: `நீங்கள் கிராம AI, இந்திய விவசாயிகளுக்கான விவசாய நிபுணர் உதவியாளர். உங்களுக்கு இந்த தலைப்புகளில் ஆழமான அறிவு உள்ளது:
${FARMING_KNOWLEDGE}
${PLAIN_TEXT_INSTRUCTION}
தமிழில் பதில் அளிக்கவும். தாள் மேலாண்மை, பயிர் நோய்கள், பூச்சிக்கொல்லிகள் மற்றும் விவசாய நுட்பங்கள் பற்றி நடைமுறை ஆலோசனை வழங்கவும்.`,
  
  bn: `আপনি গ্রাম AI, ভারতীয় কৃষকদের জন্য কৃষি বিশেষজ্ঞ সহকারী। আপনার এই বিষয়গুলিতে গভীর জ্ঞান আছে:
${FARMING_KNOWLEDGE}
${PLAIN_TEXT_INSTRUCTION}
বাংলায় উত্তর দিন। নাড়া ব্যবস্থাপনা, ফসলের রোগ, কীটনাশক এবং চাষের কৌশল সম্পর্কে ব্যবহারিক পরামর্শ দিন।`,
};

const VALID_LANGUAGES = ["en", "hi", "mr", "te", "ta", "bn"];
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 5000;

// Validate message format
interface ChatMessage {
  role: string;
  content: string;
}

function validateMessages(messages: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: "Invalid messages format" };
  }

  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: "Too many messages in history" };
  }

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: "Invalid message format" };
    }

    const message = msg as ChatMessage;
    
    if (!message.role || !message.content) {
      return { valid: false, error: "Invalid message format" };
    }

    if (message.role !== "user" && message.role !== "assistant") {
      return { valid: false, error: "Invalid message role" };
    }

    if (typeof message.content !== "string" || message.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: "Message content too long" };
    }
  }

  return { valid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, language = "en" } = body;

    // Input validation
    const messagesValidation = validateMessages(messages);
    if (!messagesValidation.valid) {
      return new Response(
        JSON.stringify({ error: messagesValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate language
    if (!VALID_LANGUAGES.includes(language)) {
      return new Response(
        JSON.stringify({ error: "Invalid language" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("API key not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      // Log minimal info for debugging without exposing details
      console.error("AI gateway error:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    // Log error type only, not full message to avoid leaking internal details
    console.error("chat error:", e instanceof Error ? e.name : "Unknown");
    return new Response(
      JSON.stringify({ error: "Unable to process request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
