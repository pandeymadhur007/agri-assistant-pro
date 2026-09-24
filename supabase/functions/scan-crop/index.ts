import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get("Authorization") || "";
    const accessToken = authorization.match(/^Bearer\\s+(.+)$/i)?.[1];
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: "Service config error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { imagePath, language = "en" } = body;
    if (
      typeof imagePath !== "string" ||
      imagePath.length > 512 ||
      imagePath.split("/")[0] !== user.id ||
      !imagePath.startsWith(`${user.id}/uploads/`) ||
      imagePath.split("/").some((part: string) => !part || part === "." || part === "..")
    ) {
      return new Response(JSON.stringify({ error: "Invalid image path" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Service config error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: signedImage, error: signingError } = await serviceClient.storage
      .from("crop-scan-uploads")
      .createSignedUrl(imagePath, 120);
    if (signingError || !signedImage?.signedUrl) {
      return new Response(JSON.stringify({ error: "Image is unavailable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const imageSource = signedImage.signedUrl;
    const langPrompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en;

    const systemPrompt = `You are an expert agricultural scientist, plant pathologist, and entomologist with 30+ years of experience in Indian agriculture. ${langPrompt}

CRITICAL ANALYSIS INSTRUCTIONS:
1. First, determine if the image contains a plant/crop. If NOT a plant, set is_plant to false.
2. Carefully identify the crop species.
3. Look for visual symptoms: spots, lesions, discoloration, wilting, curling, holes, webbing, mold, fungal growth, insect presence.
4. Cross-reference symptoms with known diseases for that specific crop in Indian conditions.
5. If the plant appears healthy, confirm it clearly.

Provide your analysis as a JSON object with these exact fields:
- is_plant: boolean
- crop_name: string
- disease_name: string (or "Healthy")
- severity: string ("healthy", "mild", "moderate", "severe", "critical")
- cause: string (pathogen name and type)
- treatment: string (step-by-step treatment with dosage)
- pesticide: string (exact commercial product names available in India with dosage)
- prevention: string (cultural practices, resistant varieties)
- additional_notes: string

Be extremely specific and practical for Indian farmers.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this crop/plant image for diseases, pests, or health issues. Return a JSON object."
              },
              {
                type: "image_url",
                image_url: { url: imageSource }
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
      
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      JSON.stringify({ success: true, diagnosis, analyzed_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("scan-crop error:", e instanceof Error ? e.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Unable to process request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
