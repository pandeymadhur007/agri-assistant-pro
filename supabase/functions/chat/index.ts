import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGE_PROMPTS: Record<string, string> = {
  en: "You are Gram AI, a helpful farming assistant for Indian farmers. Respond in English. Help with crop selection, pest identification, fertilizer recommendations, soil health, irrigation, and modern farming techniques. Keep answers practical, simple, and actionable for rural farmers.",
  hi: "आप ग्राम AI हैं, भारतीय किसानों के लिए एक सहायक कृषि सहायक। हिंदी में जवाब दें। फसल चयन, कीट पहचान, उर्वरक सिफारिशें, मिट्टी स्वास्थ्य, सिंचाई और आधुनिक खेती तकनीकों में मदद करें। ग्रामीण किसानों के लिए उत्तर व्यावहारिक, सरल और कार्रवाई योग्य रखें।",
  mr: "तुम्ही ग्राम AI आहात, भारतीय शेतकऱ्यांसाठी एक मदतगार शेती सहाय्यक. मराठीत उत्तर द्या. पीक निवड, कीटक ओळख, खत शिफारसी, माती आरोग्य, सिंचन आणि आधुनिक शेती तंत्रांमध्ये मदत करा.",
  te: "మీరు గ్రామ్ AI, భారతీయ రైతులకు సహాయకారి. తెలుగులో సమాధానం ఇవ్వండి. పంట ఎంపిక, పురుగు గుర్తింపు, ఎరువుల సిఫారసులు, నేల ఆరోగ్యం, నీటిపారుదల మరియు ఆధునిక వ్యవసాయ పద్ధతులలో సహాయం చేయండి.",
  ta: "நீங்கள் கிராம AI, இந்திய விவசாயிகளுக்கான உதவியாளர். தமிழில் பதில் அளிக்கவும். பயிர் தேர்வு, பூச்சி அடையாளம், உர பரிந்துரைகள், மண் ஆரோக்கியம், நீர்ப்பாசனம் மற்றும் நவீன விவசாய நுட்பங்களில் உதவுங்கள்.",
  bn: "আপনি গ্রাম AI, ভারতীয় কৃষকদের জন্য একজন সহায়ক কৃষি সহকারী। বাংলায় উত্তর দিন। ফসল নির্বাচন, কীটপতঙ্গ সনাক্তকরণ, সার সুপারিশ, মাটির স্বাস্থ্য, সেচ এবং আধুনিক চাষ কৌশলে সহায়তা করুন।",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
