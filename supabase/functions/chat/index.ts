import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FARMING_KNOWLEDGE = `
STUBBLE/PARALI (पराली) REMOVAL METHODS:
1. Happy Seeder, Super SMS, Rotavator, Paddy Straw Chopper, Mulching, Baling, Composting, PUSA Bio-decomposer.
WHY NOT TO BURN: Kills soil organisms, destroys nutrients, illegal (fines up to ₹15,000), causes pollution.
GOVT SUBSIDIES: 50-80% on stubble equipment via Krishi Vigyan Kendra.

CROP DISEASES, PESTS, PESTICIDES, FERTILIZERS:
- Specific Indian commercial product names with dosage
- Organic and chemical options
- Integrated Pest Management (IPM)

SEASONAL FARMING:
- Kharif (Jun-Oct): rice, cotton, maize, soybean, sugarcane
- Rabi (Nov-Apr): wheat, mustard, gram, barley
- Zaid (Mar-Jun): watermelon, cucumber, fodder
`;

const PLAIN_TEXT_INSTRUCTION = `
FORMATTING RULES:
- Plain text only. NO markdown (**, *, #, -, bullets).
- Numbered lists (1, 2, 3) only when listing steps.
- Keep responses 2-5 sentences. Direct, practical, specific.
`;

const HINGLISH_INSTRUCTION = `
LANGUAGE STYLE:
- If the user mixes English with Hindi/Marathi/Telugu/Tamil/Bengali words (Hinglish), respond in the SAME mixed style they used.
- Use simple, conversational tone — like a knowledgeable village friend, not a textbook.
- Match the user's vocabulary level and code-switching pattern.
`;

const LANGUAGE_PROMPTS: Record<string, string> = {
  en: `You are Gram AI, expert farming assistant for Indian farmers.
${FARMING_KNOWLEDGE}
${PLAIN_TEXT_INSTRUCTION}
${HINGLISH_INSTRUCTION}
Default to English but switch to mixed Hindi-English (Hinglish) if the user does.`,

  hi: `आप ग्राम AI हैं, भारतीय किसानों के विशेषज्ञ सहायक।
${FARMING_KNOWLEDGE}
${PLAIN_TEXT_INSTRUCTION}
${HINGLISH_INSTRUCTION}
मुख्यतः हिंदी में जवाब दें। अगर यूज़र Hinglish में बात करे तो आप भी Hinglish में जवाब दें।`,

  mr: `तुम्ही ग्राम AI आहात, भारतीय शेतकऱ्यांचे तज्ञ सहाय्यक.
${FARMING_KNOWLEDGE}
${PLAIN_TEXT_INSTRUCTION}
${HINGLISH_INSTRUCTION}
मुख्यतः मराठीत उत्तर द्या. वापरकर्ता मिश्र भाषेत बोलल्यास तसेच उत्तर द्या.`,

  te: `మీరు గ్రామ్ AI, భారతీయ రైతులకు నిపుణుల సహాయకుడు.
${FARMING_KNOWLEDGE}
${PLAIN_TEXT_INSTRUCTION}
${HINGLISH_INSTRUCTION}
ప్రధానంగా తెలుగులో సమాధానం ఇవ్వండి. వినియోగదారు మిశ్రమ భాషలో మాట్లాడితే మీరు కూడా అదే స్టైల్‌లో జవాబు ఇవ్వండి.`,

  ta: `நீங்கள் கிராம AI, இந்திய விவசாயிகளுக்கான நிபுணர் உதவியாளர்.
${FARMING_KNOWLEDGE}
${PLAIN_TEXT_INSTRUCTION}
${HINGLISH_INSTRUCTION}
முதன்மையாக தமிழில் பதிலளிக்கவும். பயனர் கலப்பு மொழியில் பேசினால் அதே பாணியில் பதிலளிக்கவும்.`,

  bn: `আপনি গ্রাম AI, ভারতীয় কৃষকদের বিশেষজ্ঞ সহায়ক।
${FARMING_KNOWLEDGE}
${PLAIN_TEXT_INSTRUCTION}
${HINGLISH_INSTRUCTION}
মূলত বাংলায় উত্তর দিন। ব্যবহারকারী মিশ্র ভাষায় কথা বললে একই স্টাইলে উত্তর দিন।`,
};

const VALID_LANGUAGES = ["en", "hi", "mr", "te", "ta", "bn"];
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 5000;

interface ChatMessage { role: string; content: string; }

function validateMessages(messages: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(messages)) return { valid: false, error: "Invalid messages format" };
  if (messages.length > MAX_MESSAGES) return { valid: false, error: "Too many messages" };
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") return { valid: false, error: "Invalid message" };
    const m = msg as ChatMessage;
    if (!m.role || !m.content) return { valid: false, error: "Invalid message" };
    if (m.role !== "user" && m.role !== "assistant") return { valid: false, error: "Invalid role" };
    if (typeof m.content !== "string" || m.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: "Message too long" };
    }
  }
  return { valid: true };
}

function getSeasonContext(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 10) return `Current season: Kharif (Monsoon) — month ${month}. Focus on rice, cotton, maize, soybean, sugarcane.`;
  if (month >= 11 || month <= 3) return `Current season: Rabi (Winter) — month ${month}. Focus on wheat, mustard, gram, barley, peas.`;
  return `Current season: Zaid (Summer) — month ${month}. Focus on watermelon, cucumber, fodder crops.`;
}

async function fetchRecentScans(sessionId: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) return "";
    const sb = createClient(supabaseUrl, supabaseKey);
    const { data } = await sb
      .from("crop_scans")
      .select("crop_name, disease_name, severity, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (!data || data.length === 0) return "";
    const summary = data.map((s, i) => 
      `${i + 1}. ${s.crop_name || "unknown crop"} — ${s.disease_name || "unknown"} (${s.severity || "n/a"}) on ${new Date(s.created_at).toLocaleDateString()}`
    ).join("\n");
    return `\n\nUSER'S RECENT CROP SCANS (use this context if relevant):\n${summary}\n`;
  } catch (e) {
    console.error("scan fetch failed:", e instanceof Error ? e.name : "?");
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, language = "en", location } = body;
    const sessionId = req.headers.get("x-session-id") || "";

    const v = validateMessages(messages);
    if (!v.valid) {
      return new Response(JSON.stringify({ error: v.error }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!VALID_LANGUAGES.includes(language)) {
      return new Response(JSON.stringify({ error: "Invalid language" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Service config error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build dynamic context
    const seasonCtx = getSeasonContext();
    const scanCtx = sessionId ? await fetchRecentScans(sessionId) : "";
    const locCtx = location ? `\nUser approximate location: ${location}` : "";

    const systemPrompt = (LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en) +
      `\n\nCURRENT CONTEXT:\n${seasonCtx}${locCtx}${scanCtx}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e instanceof Error ? e.name : "Unknown");
    return new Response(JSON.stringify({ error: "Unable to process request" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
