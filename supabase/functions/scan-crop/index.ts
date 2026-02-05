import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
};

const LANGUAGE_PROMPTS: Record<string, string> = {
  en: "Respond in English.",
  hi: "हिंदी में जवाब दें।",
  mr: "मराठीत उत्तर द्या.",
  te: "తెలుగులో సమాధానం ఇవ్వండి.",
  ta: "தமிழில் பதில் அளிக்கவும்.",
  bn: "বাংলায় উত্তর দিন।",
};

const VALID_LANGUAGES = ["en", "hi", "mr", "te", "ta", "bn"];

interface ScanRequest {
  imageUrl: string;
  language?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as ScanRequest;
    const { imageUrl, language = "en" } = body;

    // Input validation
    if (!imageUrl || typeof imageUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const langPrompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en;

    const systemPrompt = `You are an expert agricultural scientist and plant pathologist. Analyze the uploaded crop/plant image and identify any diseases, pests, or health issues. ${langPrompt}

Provide your analysis as a JSON object with these exact fields:
- is_plant: boolean (whether the image contains a plant/crop)
- crop_name: string (name of the crop/plant identified)
- disease_name: string (name of the disease or "Healthy" if no disease)
- severity: string (one of: "healthy", "mild", "moderate", "severe", "critical")
- cause: string (what causes this disease)
- treatment: string (recommended treatment steps)
- pesticide: string (specific pesticide/fungicide with dosage)
- prevention: string (how to prevent this disease)
- additional_notes: string (any additional helpful information)

Be specific and practical for Indian farmers.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: "Analyze this crop/plant image for diseases, pests, or health issues. Provide a complete diagnosis with treatment recommendations suitable for Indian farmers. Return your response as a JSON object."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
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

    const data = await response.json();
    
    // Extract response content
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("Unexpected response format - no content");
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    let diagnosis;
    try {
      diagnosis = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response as JSON");
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        diagnosis,
        analyzed_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("scan-crop error:", e instanceof Error ? e.name : "Unknown");
    return new Response(
      JSON.stringify({ error: "Unable to process request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
