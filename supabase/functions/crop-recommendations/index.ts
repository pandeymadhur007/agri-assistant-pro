import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_LANGUAGES = ["en", "hi", "mr", "te", "ta", "bn"];
const VALID_SOIL = ["loamy", "clay", "sandy", "black", "red", "alluvial", "unknown"];
const VALID_LAND = ["small", "medium", "large"]; // <2, 2-10, >10 acres
const VALID_BUDGET = ["low", "medium", "high"]; // <20k, 20k-1L, >1L per acre

const LANG_INSTRUCTION: Record<string, string> = {
  en: "Respond in English.",
  hi: "हिंदी में जवाब दें।",
  mr: "मराठीत उत्तर द्या.",
  te: "తెలుగులో సమాధానం ఇవ్వండి.",
  ta: "தமிழில் பதில் அளிக்கவும்.",
  bn: "বাংলায় উত্তর দিন।",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { state, soil = "unknown", landSize = "medium", budget = "medium", language = "en" } = body;

    if (!state || typeof state !== "string" || state.length > 100) {
      return new Response(JSON.stringify({ error: "Valid state required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!VALID_LANGUAGES.includes(language)) {
      return new Response(JSON.stringify({ error: "Invalid language" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!VALID_SOIL.includes(soil) || !VALID_LAND.includes(landSize) || !VALID_BUDGET.includes(budget)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Service config error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const month = new Date().getMonth() + 1;
    const season = (month >= 6 && month <= 10) ? "Kharif" : (month >= 11 || month <= 3) ? "Rabi" : "Zaid";

    const systemPrompt = `You are an expert Indian agricultural advisor. ${LANG_INSTRUCTION[language]}
Recommend the BEST 5 crops to grow based on the farmer's profile. Consider local climate, soil, season, market demand, and ROI.

Return ONLY a valid JSON object (no markdown) with this exact structure:
{
  "recommendations": [
    {
      "crop_name": "string (in user's language)",
      "crop_name_en": "string (English name)",
      "suitability_score": number (1-100),
      "reason": "string (2 sentences why this fits)",
      "expected_yield": "string (e.g. '20-25 quintals/acre')",
      "investment_per_acre": "string (e.g. '₹15,000-20,000')",
      "expected_profit_per_acre": "string (e.g. '₹40,000-60,000')",
      "duration_days": number,
      "water_requirement": "low" | "medium" | "high",
      "key_tips": "string (1-2 short practical tips)"
    }
  ],
  "season": "string (current season name)",
  "summary": "string (1 sentence overall guidance)"
}`;

    const userPrompt = `Farmer profile:
- State: ${state}
- Current season: ${season} (month ${month})
- Soil type: ${soil}
- Land size: ${landSize} (small=<2 acres, medium=2-10, large=>10)
- Budget per acre: ${budget} (low=<₹20k, medium=₹20k-1L, high=>₹1L)

Suggest 5 highly suitable crops ranked by suitability_score.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI error:", response.status);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: "No recommendations generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed;
    try { parsed = JSON.parse(content); }
    catch {
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, ...parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("crop-rec error:", e instanceof Error ? e.name : "Unknown");
    return new Response(JSON.stringify({ error: "Unable to process request" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
