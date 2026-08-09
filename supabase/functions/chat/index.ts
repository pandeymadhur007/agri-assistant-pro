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
LANGUAGE MATCHING (HIGHEST PRIORITY — overrides the default UI language):
- ALWAYS reply in the SAME language and the SAME script as the user's most recent message. Never mix scripts in one reply.
- If the user writes in plain English (Latin script), reply in plain English ONLY. Do NOT use Hindi/Hinglish words and do NOT use Devanagari or any other Indic script.
- If the user writes in Hindi/Marathi/Telugu/Tamil/Bengali native script, reply entirely in that language and script.
- Only use romanised Hinglish/Tanglish if the user themselves wrote romanised Indian language in Latin script.
- The UI language setting is only a fallback for the very first message — once the user types, mirror them exactly.
- Use a simple, conversational tone — like a knowledgeable village friend, not a textbook.
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
      .limit(3);
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

    // Build dynamic context. The scan lookup is capped at 700ms so a slow DB
    // round-trip can never delay the first token of the reply.
    const seasonCtx = getSeasonContext();
    const scanCtx = sessionId
      ? await Promise.race([
          fetchRecentScans(sessionId),
          new Promise<string>((resolve) => setTimeout(() => resolve(""), 700)),
        ])
      : "";
    const locCtx = location ? `\nUser approximate location: ${location}` : "";

    const systemPrompt = (LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en) +
      `\n\nCURRENT CONTEXT:\n${seasonCtx}${locCtx}${scanCtx}`;

    // Detect the script of the latest user message so the reply never drifts to
    // another language/script than the one the farmer actually typed in.
    const lastUser = [...messages].reverse().find((m: ChatMessage) => m.role === "user")?.content ?? "";
    const scriptRules: Array<[RegExp, string]> = [
      [/[\u0900-\u097F]/, "Hindi or Marathi (Devanagari script)"],
      [/[\u0C00-\u0C7F]/, "Telugu (Telugu script)"],
      [/[\u0B80-\u0BFF]/, "Tamil (Tamil script)"],
      [/[\u0980-\u09FF]/, "Bengali (Bengali script)"],
      [/[\u0A00-\u0A7F]/, "Punjabi (Gurmukhi script)"],
      [/[\u0A80-\u0AFF]/, "Gujarati (Gujarati script)"],
      [/[\u0C80-\u0CFF]/, "Kannada (Kannada script)"],
      [/[\u0D00-\u0D7F]/, "Malayalam (Malayalam script)"],
    ];
    const detected = scriptRules.find(([re]) => re.test(lastUser))?.[1];
    const replyRule = detected
      ? `The user's last message is written in ${detected}. Reply ONLY in that same language and script.`
      : `The user's last message is written in the Latin alphabet. Reply ONLY in plain English using the Latin alphabet. Do NOT output any Devanagari/Telugu/Tamil/Bengali characters and do NOT use Hindi or Hinglish words, unless the user's own message contained romanised Indian-language words.`;

    const finalSystemPrompt = `${systemPrompt}\n\nFINAL AND MOST IMPORTANT RULE:\n${replyRule}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "system", content: finalSystemPrompt }, ...messages],
        stream: true,
        max_tokens: 500,
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
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("chat error:", e instanceof Error ? e.name : "Unknown");
    return new Response(JSON.stringify({ error: "Unable to process request" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
