import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language mapping for better transcription hints
const LANG_MAP: Record<string, string> = {
  'en': 'en-IN',
  'hi': 'hi-IN',
  'mr': 'mr-IN',
  'te': 'te-IN',
  'ta': 'ta-IN',
  'bn': 'bn-IN',
};

// Convert base64 to binary data
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, language = 'en' } = await req.json();

    if (!audio) {
      return new Response(
        JSON.stringify({ error: 'Audio data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SARVAM_API_KEY = Deno.env.get('SARVAM_API_KEY');
    if (!SARVAM_API_KEY) {
      console.error('SARVAM_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Speech service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetLang = LANG_MAP[language] || LANG_MAP['en'];
    console.log(`Processing speech-to-text request for language: ${language} mapped to ${targetLang}`);

    // Decode base64 audio to binary
    let audioBytes: Uint8Array;
    try {
      audioBytes = base64ToUint8Array(audio);
    } catch (e) {
      console.error("Invalid base64 audio data", e);
      return new Response(
        JSON.stringify({ error: 'Invalid audio encoding' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = new FormData();
    const blob = new Blob([audioBytes], { type: 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', 'saaras:v3');
    formData.append('mode', 'transcribe');
    // Using language 'unknown' allows Sarvam's API to auto-detect if the provided code is not accurate, but specifying helps.
    // Given the task says "English, Hindi, Marathi, Telugu, Tamil, Bengali", let's pass the mapped language.
    formData.append('language_code', targetLang);

    // Use Sarvam's STT API
    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        // Don't set Content-Type here, let fetch handle the boundary for multipart/form-data
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service credits exhausted. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to transcribe audio' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const transcript = data.transcript || '';
    
    console.log(`Transcription successful: "${transcript.substring(0, 50)}..."`);

    return new Response(
      JSON.stringify({ transcript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Speech-to-text error:', error instanceof Error ? error.name : 'Unknown');
    return new Response(
      JSON.stringify({ error: 'Unable to process audio' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
