
## Why voice-to-text isn't working today

The current `useVoiceAssistant` hook relies on the browser's built-in `SpeechRecognition` API (Web Speech). That API is the reason it fails:

- **Not supported on most browsers.** It only works in Chrome/Edge on desktop and Chrome on Android. Firefox, Safari (desktop), Brave, in-app browsers, and most Android WebViews return "unsupported" or silently stop after 1–2 seconds.
- **Requires Google's speech servers** — blocked on many networks and in India frequently drops mid-utterance.
- **No support inside a Capacitor/Play Store build** (which is where this app is heading).
- **Poor accuracy for Hindi/Marathi/Telugu/Tamil/Bengali** even when it does connect.

You do **not** need to sign up for a new third-party API. The project already has:

1. An edge function `supabase/functions/speech-to-text/index.ts` that transcribes audio via the **Lovable AI Gateway** (no extra key needed — `LOVABLE_API_KEY` is already set).
2. A hook `src/hooks/useCloudSpeechRecognition.ts` that records mic audio, converts it to WAV, and calls that function.

They're just not wired into the voice orb. We'll switch to them and upgrade to the purpose-built transcription model.

## Plan

### 1. Upgrade the edge function to the real STT model
`supabase/functions/speech-to-text/index.ts`
- Replace the current Gemini chat-completions call (which is fragile for audio and rejects webm/mp4) with the dedicated `/v1/audio/transcriptions` endpoint using **`openai/gpt-4o-transcribe`** — Lovable AI's default speech-to-text model, higher accuracy, supports Hindi/Marathi/Telugu/Tamil/Bengali auto-detect.
- Accept the audio as base64, decode to a Blob, send as `multipart/form-data` with `file`, `model`, and optional `language` (ISO-639-1) hint.
- Keep the same `{ transcript }` response shape so the frontend doesn't change contract.
- Return proper 4xx errors so the UI can show "please try again" instead of a generic 500.

### 2. Rewrite the voice hook to use cloud STT
`src/hooks/useVoiceAssistant.ts`
- Remove all `SpeechRecognition` code.
- Use `MediaRecorder` (webm on Chrome/Android, mp4 on iOS Safari) with silence detection via the Web Audio API (`AnalyserNode` on the mic stream):
  - Start recording on tap.
  - Watch RMS volume; when below threshold for ~1.4 s after some speech was detected, stop the recorder → send blob to `speech-to-text` edge function → get transcript → hand to Gemini chat → speak reply → auto-resume recording.
  - Barge-in: if volume rises while TTS is speaking, cancel `speechSynthesis` immediately.
- Keep the same public API (`state`, `listening`, `interim`, `error`, `isSupported`, `start`, `stop`, `toggle`) so `VoiceOrb.tsx` and `ChatInterface.tsx` don't need changes.
- `isSupported` now checks `navigator.mediaDevices.getUserMedia` + `MediaRecorder` — works in Safari, Firefox, Brave, and Capacitor.
- `interim` will show "Listening…" / "Transcribing…" instead of live partial text (cloud STT is non-streaming per utterance; still feels instant because we only send after silence).

### 3. Pass the selected language to STT
- Read the user's active language from `LanguageContext` and forward it to the edge function so Hindi/Marathi/etc. are transcribed correctly.

### 4. Minor UI copy
`src/components/VoiceOrb.tsx`
- Update the unsupported-browser message to reflect the new requirement ("microphone access") rather than "SpeechRecognition not supported".

## What you get
- Works in **every modern browser + Capacitor Android build**.
- Much better accuracy in Indian languages.
- Same ChatGPT-style flow: tap once → listen → auto-stop on silence → think → speak → auto-resume.
- No new API keys, no new signup, no extra cost beyond your existing Lovable AI credits.

## Files to change
- `supabase/functions/speech-to-text/index.ts` — swap to `/v1/audio/transcriptions` with `openai/gpt-4o-transcribe`.
- `src/hooks/useVoiceAssistant.ts` — rewrite to use `MediaRecorder` + Web Audio silence detection + cloud STT.
- `src/components/VoiceOrb.tsx` — tiny copy tweak for the fallback message.

No database changes, no new secrets, no changes to `ChatInterface.tsx` or any page.
