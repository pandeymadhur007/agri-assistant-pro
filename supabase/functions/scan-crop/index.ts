import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

You MUST respond using the suggest_diagnosis tool with your analysis. Be specific and practical for Indian farmers.

If the image is not a plant/crop, still use the tool but set is_plant to false and provide a helpful message.`;

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
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: "Analyze this crop/plant image for diseases, pests, or health issues. Provide a complete diagnosis with treatment recommendations suitable for Indian farmers."
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
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_diagnosis",
              description: "Return the crop disease diagnosis and treatment recommendations",
              parameters: {
                type: "object",
                properties: {
                  is_plant: {
                    type: "boolean",
                    description: "Whether the image contains a plant/crop"
                  },
                  crop_name: {
                    type: "string",
                    description: "Name of the crop/plant identified (e.g., Tomato, Rice, Wheat)"
                  },
                  disease_name: {
                    type: "string",
                    description: "Name of the disease or issue detected (e.g., Leaf Blight, Powdery Mildew, Healthy)"
                  },
                  severity: {
                    type: "string",
                    enum: ["healthy", "mild", "moderate", "severe", "critical"],
                    description: "Severity level of the disease"
                  },
                  cause: {
                    type: "string",
                    description: "What causes this disease (e.g., Fungal infection, Bacterial, Viral, Nutrient deficiency)"
                  },
                  treatment: {
                    type: "string",
                    description: "Recommended treatment steps for the farmer"
                  },
                  pesticide: {
                    type: "string",
                    description: "Specific pesticide, fungicide, or fertilizer to use with dosage"
                  },
                  prevention: {
                    type: "string",
                    description: "How to prevent this disease in the future"
                  },
                  additional_notes: {
                    type: "string",
                    description: "Any additional helpful information for the farmer"
                  }
                },
                required: ["is_plant", "crop_name", "disease_name", "severity", "cause", "treatment", "pesticide", "prevention"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_diagnosis" } }
      }),
    });

    if (!response.ok) {
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

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "suggest_diagnosis") {
      console.error("Unexpected response format");
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const diagnosis = JSON.parse(toolCall.function.arguments);

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
