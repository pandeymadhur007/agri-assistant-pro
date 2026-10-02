import { useState } from 'react';
import { Mic, Send, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type T = (en: string, hi: string) => string;

/** Ask Gram AI about this farm — answers use the saved farm profile, weather and history. */
export function AskMyFarm({ onAsk, t }: { onAsk: (q: string, voice?: boolean) => void; t: T }) {
  const [q, setQ] = useState('');
  const chips = [
    t('Does my crop need pesticide this week?', 'क्या इस हफ्ते मेरी फसल को कीटनाशक चाहिए?'),
    t('How much fertilizer should I give now?', 'अभी कितनी खाद देनी चाहिए?'),
    t('When should I irrigate next?', 'अगली सिंचाई कब करूँ?'),
  ];
  const submit = () => { if (q.trim()) onAsk(q.trim()); };
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sprout className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">{t('Ask about my farm', 'मेरे खेत के बारे में पूछें')}</h2>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        {t('Answers use your crop, soil, irrigation, location and weather.', 'जवाब आपकी फसल, मिट्टी, सिंचाई, स्थान और मौसम पर आधारित होंगे।')}
      </p>
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t('Type your question…', 'अपना सवाल लिखें…')} className="h-12" />
        {q.trim() ? (
          <Button size="icon" className="h-12 w-12 shrink-0" onClick={submit} aria-label={t('Send', 'भेजें')}><Send className="h-5 w-5" /></Button>
        ) : (
          <Button size="icon" className="h-12 w-12 shrink-0" onClick={() => onAsk('', true)} aria-label={t('Ask by voice', 'बोलकर पूछें')}><Mic className="h-5 w-5" /></Button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button key={c} type="button" onClick={() => onAsk(c)}
            className="min-h-[40px] rounded-full bg-secondary px-3 py-2 text-left text-sm text-secondary-foreground hover:bg-secondary/80">{c}</button>
        ))}
      </div>
    </div>
  );
}
