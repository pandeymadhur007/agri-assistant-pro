import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language mapping for better transcription hints
const LANGUAGE_HINTS: Record<string, string> = {
  'en': 'English (Indian accent)',
  'hi': 'Hindi',
  'mr': 'Marathi',
  'te': 'Telugu',
  'ta': 'Tamil',
  'bn': 'Bengali',
};

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Speech service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const languageHint = LANGUAGE_HINTS[language] || 'English';
    
    console.log(`Processing speech-to-text request for language: ${language}`);

    // Use Gemini's audio understanding capabilities
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a speech-to-text transcription assistant. Your only job is to transcribe the audio accurately. 
The audio is likely in ${languageHint}. 
Return ONLY the transcribed text, nothing else. No quotes, no explanations, no prefixes like "The transcription is:".
If you cannot understand the audio or it's silent, return an empty string.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Transcribe this audio:'
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: audio,
                  format: 'wav'
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
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
    const transcript = data.choices?.[0]?.message?.content?.trim() || '';
    
    console.log(`Transcription successful: "${transcript.substring(0, 50)}..."`);

    return new Response(
      JSON.stringify({ transcript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log error type only, not full message to avoid leaking internal details
    console.error('Speech-to-text error:', error instanceof Error ? error.name : 'Unknown');
    return new Response(
      JSON.stringify({ error: 'Unable to process audio' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
