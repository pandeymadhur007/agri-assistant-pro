import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Sarvam AI TTS — language → BCP-47 code expected by Sarvam.
// Docs: https://docs.sarvam.ai/api-reference-docs/text-to-speech/convert
const LANG_MAP: Record<string, string> = {
  "en": "en-IN",
  "hi": "hi-IN",
  "mr": "mr-IN",
  "te": "te-IN",
  "ta": "ta-IN",
  "bn": "bn-IN",
};

// Default speaker (Sarvam "bulbul:v2" model voice). "anushka" is a neutral female voice
// that works well across all supported Indian languages.
const DEFAULT_SPEAKER = "anushka";

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
    const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY");
    if (!SARVAM_API_KEY) {
      console.error("SARVAM_API_KEY not configured");
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

    // Sarvam recommends ≤ 1500 chars per request for best latency.
    const trimmedText = text.slice(0, 1500);
    const targetLang = LANG_MAP[language] || LANG_MAP["en"];

    console.log(`Sarvam TTS: lang=${targetLang}, speaker=${DEFAULT_SPEAKER}, len=${trimmedText.length}`);

    const sarvamResponse = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: JSON.stringify({
        text: trimmedText,
        target_language_code: targetLang,
        speaker: DEFAULT_SPEAKER,
        model: "bulbul:v2",
        pitch: 0,
        pace: 1.0,
        loudness: 1.0,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
      }),
    });

    if (!sarvamResponse.ok) {
      const errorText = await sarvamResponse.text();
      console.error(`Sarvam API error: ${sarvamResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: "SPEECH_GENERATION_FAILED", fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sarvamData = await sarvamResponse.json();
    // Sarvam returns { audios: [base64, ...], request_id }. Concatenate all chunks.
    const audios: string[] = sarvamData?.audios || [];
    if (!audios.length) {
      console.error("Sarvam API returned no audio data");
      return new Response(
        JSON.stringify({ error: "NO_AUDIO", fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The first chunk usually contains the entire short clip; for multi-chunk
    // responses, return only the first chunk (client plays one Audio element).
    // To play all chunks reliably we'd need to merge WAV containers, so we keep
    // requests short (≤1500 chars) which fits in one chunk.
    const audioBase64 = audios[0];

    console.log(`Sarvam TTS success: ${audios.length} chunk(s)`);

    return new Response(
      JSON.stringify({ audio: audioBase64, mime: "audio/wav" }),
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
