import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Voice mapping for Indian regional languages
const VOICE_MAP: Record<string, string> = {
  "en": "en-IN-isha",    // Indian English female
  "hi": "hi-IN-kabir",   // Hindi male
  "mr": "hi-IN-kabir",   // Marathi fallback to Hindi
  "te": "te-IN-mahathi", // Telugu female
  "ta": "ta-IN-meena",   // Tamil female
  "bn": "bn-IN-atreyee", // Bengali female
};

interface MurfRequest {
  text: string;
  language?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MURF_API_KEY = Deno.env.get("MURF_API_KEY");
    if (!MURF_API_KEY) {
      console.error("MURF_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "TTS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, language = "en" }: MurfRequest = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit text length to avoid excessive API costs
    const trimmedText = text.slice(0, 3000);
    
    // Get voice ID for the language
    const voiceId = VOICE_MAP[language] || VOICE_MAP["en"];
    
    console.log(`Generating speech: lang=${language}, voice=${voiceId}, text length=${trimmedText.length}`);

    const murfResponse = await fetch("https://api.murf.ai/v1/speech/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": MURF_API_KEY,
      },
      body: JSON.stringify({
        text: trimmedText,
        voiceId: voiceId,
        format: "MP3",
        encodeAsBase64: true,
        modelVersion: "GEN2",
        sampleRate: 24000,
        channelType: "MONO",
      }),
    });

    if (!murfResponse.ok) {
      const errorText = await murfResponse.text();
      console.error(`Murf API error: ${murfResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to generate speech" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const murfData = await murfResponse.json();
    
    if (!murfData.encodedAudio) {
      console.error("Murf API returned no audio data");
      return new Response(
        JSON.stringify({ error: "No audio generated" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Speech generated successfully");

    return new Response(
      JSON.stringify({ audio: murfData.encodedAudio }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
