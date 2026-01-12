import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGE_PROMPTS: Record<string, string> = {
  en: "You are Gram AI, a farming assistant for Indian farmers. Respond in English. Give SHORT, CRISP answers in 2-4 sentences max. Use bullet points for lists. Be direct and practical. No lengthy explanations - farmers need quick, actionable advice.",
  hi: "आप ग्राम AI हैं। हिंदी में जवाब दें। छोटे, स्पष्ट जवाब दें - अधिकतम 2-4 वाक्य। सूची के लिए बुलेट पॉइंट्स का उपयोग करें। सीधे और व्यावहारिक रहें।",
  mr: "तुम्ही ग्राम AI आहात. मराठीत उत्तर द्या. लहान, स्पष्ट उत्तरे द्या - जास्तीत जास्त 2-4 वाक्ये. सूचीसाठी बुलेट पॉइंट वापरा. थेट आणि व्यावहारिक रहा.",
  te: "మీరు గ్రామ్ AI. తెలుగులో సమాధానం ఇవ్వండి. చిన్న, స్పష్టమైన సమాధానాలు ఇవ్వండి - గరిష్టంగా 2-4 వాక్యాలు. జాబితాలకు బుల్లెట్ పాయింట్లు వాడండి.",
  ta: "நீங்கள் கிராம AI. தமிழில் பதில் அளிக்கவும். சுருக்கமான, தெளிவான பதில்கள் கொடுங்கள் - அதிகபட்சம் 2-4 வாக்கியங்கள். பட்டியல்களுக்கு புல்லட் பாயின்ட்கள் பயன்படுத்தவும்.",
  bn: "আপনি গ্রাম AI। বাংলায় উত্তর দিন। সংক্ষিপ্ত, স্পষ্ট উত্তর দিন - সর্বোচ্চ ২-৪ বাক্য। তালিকার জন্য বুলেট পয়েন্ট ব্যবহার করুন।",
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
