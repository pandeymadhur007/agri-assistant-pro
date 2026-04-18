
Continue from yesterday's Phase 1 work. The user wants to keep building the features list. Yesterday completed: context-aware chat, smart crop recommendations, enhanced scanner history, weather widget. 

Remaining from the approved roadmap (no login yet — user said login takes time/DB):
1. **Voice-to-voice continuous mode** (toggle push-to-talk vs hands-free) — user picked "Toggle between both"
2. **Government Scheme Intelligence** — personalized recommendations by state/category, deadline tracker, document checklist (works without login using session)
3. **Advanced market features** — 30-day price history graph, AI trend prediction, sell-now-vs-wait guidance
4. **Smart notifications/reminders** — needs login per user's own note, so SKIP for now
5. **Voice TTS quality (Hinglish robotic)** — user declined ElevenLabs plan yesterday, so SKIP

### Plan: Build voice-to-voice mode + Scheme Intelligence + Market history graph

#### 1. Voice-to-voice continuous conversation mode
- Add hands-free toggle in `ChatInterface.tsx`: when ON, after assistant finishes TTS, auto-restart mic; when user stops speaking (silence detect ~1.5s), auto-send
- Use existing `useCloudSpeechRecognition` + `useMurfTTS`
- New small hook `useVoiceMode.ts` orchestrating the loop with a Mode toggle (Push-to-Talk / Hands-Free)
- Visual indicator: pulsing mic when listening, waveform when assistant speaking

#### 2. Government Scheme Intelligence (no-login version)
- Update `Schemes.tsx`: add filter chips for state + category, "For You" section ranked by selected state
- New page `SchemeDetail.tsx` showing: eligibility checklist, document checklist (interactive checkboxes stored in localStorage), how-to-apply steps, official link button, deadline (if any)
- Add `application_deadline` and `success_rate` columns to `schemes` table via migration (nullable, with sample data backfill for top schemes)
- Wire route `/schemes/:id`

#### 3. Advanced Market Features  
- Update `MarketPriceCrop.tsx`: add 30-day price history line chart (recharts already in project)
- Backfill `market_prices` with synthetic 30-day history per crop+mandi via edge function update (`fetch-market-prices` already inserts daily — extend to seed history on first call per crop)
- Add "AI Insight" card per crop calling new edge function `market-insight` that returns: trend (rising/falling/stable), 7-day forecast, sell-now-vs-wait recommendation in user's language

### Files to create/modify
**New:**
- `src/hooks/useVoiceMode.ts`
- `src/pages/SchemeDetail.tsx`
- `supabase/functions/market-insight/index.ts`

**Modified:**
- `src/components/ChatInterface.tsx` (voice mode toggle + auto-loop)
- `src/pages/Schemes.tsx` (filters + For You ranking)
- `src/pages/MarketPriceCrop.tsx` (30-day chart + AI insight card)
- `src/App.tsx` (register `/schemes/:id` route)
- `src/lib/i18n.ts` (new strings)

**Migration:** Add `application_deadline DATE`, `success_rate INTEGER`, `eligibility_criteria JSONB` to `schemes`.

### Skipping (per your decisions)
- Login-gated reminders & notifications (deferred until you're ready for auth)
- ElevenLabs TTS swap (you declined yesterday)

Ready to proceed when you approve.
