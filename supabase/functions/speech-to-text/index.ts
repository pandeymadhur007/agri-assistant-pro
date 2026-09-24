import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ISO-639-1 language codes accepted by the transcription model.
const SUPPORTED_LANGS = new Set(['en', 'hi', 'mr', 'te', 'ta', 'bn']);
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get('Authorization') || '';
    const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!accessToken) return jsonResponse({ error: 'Authentication required' }, 401);
    if (!supabaseUrl || !anonKey) return jsonResponse({ error: 'Speech service not configured' }, 500);

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user) return jsonResponse({ error: 'Authentication required' }, 401);

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > MAX_AUDIO_BYTES * 1.5) return jsonResponse({ error: 'Recording is too large.' }, 413);

    const { audio, language = 'en', mimeType = 'audio/wav' } = await req.json();

    if (!audio || typeof audio !== 'string') {
      return jsonResponse({ error: 'Audio data is required' }, 400);
    }

    if (typeof language !== 'string' || !SUPPORTED_LANGS.has(language)) {
      return jsonResponse({ error: 'Unsupported language' }, 400);
    }
    const supportedMimeTypes = ['audio/wav', 'audio/x-wav', 'audio/webm', 'audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/ogg'];
    if (typeof mimeType !== 'string' || !supportedMimeTypes.some((type) => mimeType.toLowerCase().startsWith(type))) {
      return jsonResponse({ error: 'Unsupported audio format' }, 415);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return jsonResponse({ error: 'Speech service not configured' }, 500);
    }

    const estimatedBytes = Math.round((audio.length * 3) / 4);
    // 16 kHz mono 16-bit WAV: ~0.5s minimum. Shorter clips are rejected upstream
    // as "Audio file might be corrupted or unsupported".
    if (estimatedBytes < 16044) {
      return jsonResponse({ error: 'Recording is too short. Please speak for at least a second.' }, 400);
    }
    if (estimatedBytes > MAX_AUDIO_BYTES) {
      return jsonResponse({ error: 'Recording is too large. Please speak a shorter message.' }, 413);
    }

    console.log(`STT request: lang=${language} mime=${mimeType} bytes~=${estimatedBytes}`);

    // Decode base64 -> Blob and forward to the dedicated STT endpoint.
    const bytes = base64ToBytes(audio);
    // Map mime -> extension. OpenAI infers container from the filename.
    const ext = mimeType.includes('wav') ? 'wav'
      : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a'
      : mimeType.includes('mpeg') || mimeType.includes('mp3') ? 'mp3'
      : mimeType.includes('ogg') ? 'ogg'
      : 'webm';
    const audioBlob = new Blob([bytes], { type: mimeType });

    const form = new FormData();
    form.append('file', audioBlob, `recording.${ext}`);
    form.append('model', 'openai/gpt-4o-transcribe');
    if (SUPPORTED_LANGS.has(language)) {
      form.append('language', language);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 22000);
    const response = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
      body: form,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('STT gateway error:', response.status, errorText);

      if (response.status === 429) {
        return jsonResponse({ error: 'Rate limit exceeded. Please try again in a moment.' }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ error: 'Service credits exhausted. Please try again later.' }, 402);
      }

      return jsonResponse({ error: 'Failed to transcribe audio' }, response.status);
    }

    const data = await response.json();
    const transcript = (data.text ?? data.transcript ?? '').trim();

    console.log('Transcription successful');

    return jsonResponse({ transcript });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown';
    console.error('Speech-to-text error:', message);
    if (error instanceof Error && error.name === 'AbortError') {
      return jsonResponse({ error: 'Speech service timed out. Please try a shorter message.' }, 504);
    }
    return jsonResponse({ error: 'Unable to process audio' }, 500);
  }
});
