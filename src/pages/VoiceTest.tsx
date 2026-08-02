import { useCallback, useRef, useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TARGET_SAMPLE_RATE = 16000;
const MIN_WAV_BYTES = 2400;
const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'bn', label: 'বাংলা' },
];

function downsample(input: Float32Array, inRate: number, outRate: number): Float32Array {
  if (outRate === inRate) return input;
  const ratio = inRate / outRate;
  const out = new Float32Array(Math.max(1, Math.round(input.length / ratio)));
  let offset = 0;
  for (let i = 0; i < out.length; i++) {
    const next = Math.round((i + 1) * ratio);
    let sum = 0, count = 0;
    for (let j = offset; j < next && j < input.length; j++) { sum += input[j]; count++; }
    out[i] = count > 0 ? sum / count : 0;
    offset = next;
  }
  return out;
}

function encodeWav(chunks: Float32Array[], inRate: number): Blob {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Float32Array(total);
  let o = 0;
  for (const c of chunks) { merged.set(c, o); o += c.length; }
  const samples = downsample(merged, inRate, TARGET_SAMPLE_RATE);
  const dataLength = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const str = (pos: number, v: string) => { for (let i = 0; i < v.length; i++) view.setUint8(pos + i, v.charCodeAt(i)); };
  str(0, 'RIFF'); view.setUint32(4, 36 + dataLength, true); str(8, 'WAVE');
  str(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, TARGET_SAMPLE_RATE, true); view.setUint32(28, TARGET_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  str(36, 'data'); view.setUint32(40, dataLength, true);
  let p = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    p += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve((r.result as string).split(',')[1] || '');
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

type Status = 'idle' | 'recording' | 'transcribing';

const VoiceTest = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [language, setLanguage] = useState('en');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [meta, setMeta] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);

  const cleanup = useCallback(async () => {
    nodeRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (ctxRef.current && ctxRef.current.state !== 'closed') await ctxRef.current.close();
    nodeRef.current = null; sourceRef.current = null; streamRef.current = null; ctxRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(''); setTranscript(''); setMeta('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const node = ctx.createScriptProcessor(4096, 1, 1);
      nodeRef.current = node;
      chunksRef.current = [];
      node.onaudioprocess = (e) => {
        chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(node);
      node.connect(ctx.destination);
      setStatus('recording');
    } catch (e) {
      setError(e instanceof Error && e.name === 'NotAllowedError'
        ? 'Microphone permission denied. Allow mic access and try again.'
        : 'Could not access the microphone on this device.');
      await cleanup();
      setStatus('idle');
    }
  }, [cleanup]);

  const stop = useCallback(async () => {
    const rate = ctxRef.current?.sampleRate ?? 48000;
    const chunks = chunksRef.current;
    chunksRef.current = [];
    await cleanup();

    if (!chunks.length) { setStatus('idle'); setError('No audio captured. Try again.'); return; }
    const wav = encodeWav(chunks, rate);
    if (wav.size < MIN_WAV_BYTES) {
      setStatus('idle');
      setError('That clip was too short. Hold the recording for a second or two.');
      return;
    }

    setStatus('transcribing');
    const started = performance.now();
    try {
      const audio = await blobToBase64(wav);
      const { data, error: fnError } = await supabase.functions.invoke('speech-to-text', {
        body: { audio, language, mimeType: 'audio/wav' },
      });
      const ms = Math.round(performance.now() - started);
      if (fnError) {
        setError(fnError.message || 'Transcription request failed.');
      } else if (!data?.transcript) {
        setError(data?.error || 'No speech detected in that clip.');
      } else {
        setTranscript(data.transcript);
      }
      setMeta(`${(wav.size / 1024).toFixed(1)} KB WAV · 16 kHz mono · ${ms} ms round-trip`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error while transcribing.');
    } finally {
      setStatus('idle');
    }
  }, [cleanup, language]);

  const recording = status === 'recording';
  const busy = status === 'transcribing';

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <SEO title="Voice Test — Speech to Text Check" description="Record a short clip and instantly see the transcript to verify Gram AI speech recognition." />
      <Navbar />
      <main className="flex-1 container max-w-xl py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Voice test</h1>
          <p className="text-sm text-muted-foreground">
            Record a short clip and get the transcript straight back — no chat, no AI reply.
          </p>
        </header>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recorder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  disabled={recording || busy}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
                    language === l.code ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3 py-2">
              <Button
                size="lg"
                variant={recording ? 'destructive' : 'default'}
                onClick={recording ? stop : start}
                disabled={busy}
                className="h-16 w-16 rounded-full p-0"
                aria-label={recording ? 'Stop recording' : 'Start recording'}
              >
                {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : recording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {busy ? 'Transcribing…' : recording ? 'Recording — tap to stop' : 'Tap to record'}
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        )}

        {transcript && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Transcript</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{transcript}</p>
            </CardContent>
          </Card>
        )}

        {meta && <p className="text-xs text-muted-foreground text-center">{meta}</p>}
      </main>
    </div>
  );
};

export default VoiceTest;
