import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles, RotateCcw, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Answers {
  category: string;     // farmers | women | students | rural_workers
  state: string;
  landSize: string;     // none | small | medium | large
  age: string;          // u18 | 18_60 | o60
}

const STATES = [
  'All India', 'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
];

const STEPS = 4;

export function SchemeEligibilityChecker({
  schemes,
  language,
  onOpenScheme,
}: {
  schemes: any[];
  language: string;
  onOpenScheme: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ category: '', state: '', landSize: '', age: '' });
  const [submitted, setSubmitted] = useState(false);

  const isHi = language === 'hi';

  const matches = useMemo(() => {
    if (!submitted || !schemes) return [];
    return schemes
      .map((s) => {
        let score = 0;
        const reasons: string[] = [];
        if (s.category === answers.category) {
          score += 50;
          reasons.push(isHi ? 'श्रेणी मेल खाती है' : 'Category matches');
        }
        if (!s.state || s.state === answers.state || s.state === 'All India') {
          score += 25;
          if (s.state === answers.state) reasons.push(isHi ? 'राज्य मेल खाता है' : 'State matches');
          else reasons.push(isHi ? 'अखिल भारतीय योजना' : 'Pan-India scheme');
        }
        if (typeof s.success_rate === 'number') score += s.success_rate / 5;
        if (s.application_deadline) {
          const days = (new Date(s.application_deadline).getTime() - Date.now()) / 86400000;
          if (days > 0) {
            score += 10;
            if (days < 60) reasons.push(isHi ? `${Math.ceil(days)} दिन शेष` : `${Math.ceil(days)} days left`);
          }
        }
        return { scheme: s, score, reasons };
      })
      .filter((m) => m.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [submitted, schemes, answers, isHi]);

  const reset = () => {
    setAnswers({ category: '', state: '', landSize: '', age: '' });
    setStep(0);
    setSubmitted(false);
  };

  const next = () => {
    if (step < STEPS - 1) setStep(step + 1);
    else setSubmitted(true);
  };

  const canProceed = () => {
    if (step === 0) return !!answers.category;
    if (step === 1) return !!answers.state;
    if (step === 2) return !!answers.landSize;
    if (step === 3) return !!answers.age;
    return false;
  };

  const labels = {
    title: isHi ? 'पात्रता जाँचकर्ता' : 'Eligibility Checker',
    subtitle: isHi
      ? '4 छोटे प्रश्नों के उत्तर दें — हम आपके लिए सही योजनाएँ ढूँढेंगे'
      : 'Answer 4 quick questions — we’ll find the schemes you qualify for',
    next: isHi ? 'अगला' : 'Next',
    findSchemes: isHi ? 'योजनाएँ खोजें' : 'Find Schemes',
    back: isHi ? 'पीछे' : 'Back',
    restart: isHi ? 'फिर से शुरू करें' : 'Start over',
    youQualify: isHi ? 'आप इन योजनाओं के लिए पात्र हो सकते हैं' : 'You may qualify for',
    noMatches: isHi ? 'कोई मेल नहीं मिला — सभी योजनाएँ देखें' : 'No matches found — browse all schemes',
    viewDetails: isHi ? 'विवरण देखें' : 'View details',
  };

  const questions = [
    {
      key: 'category',
      q: isHi ? 'आप क्या हैं?' : 'Who are you?',
      options: [
        { value: 'farmers', label: isHi ? 'किसान' : 'Farmer' },
        { value: 'women', label: isHi ? 'महिला' : 'Woman' },
        { value: 'students', label: isHi ? 'छात्र' : 'Student' },
        { value: 'rural_workers', label: isHi ? 'ग्रामीण मजदूर' : 'Rural Worker' },
      ],
    },
    {
      key: 'state',
      q: isHi ? 'आप किस राज्य से हैं?' : 'Which state are you from?',
      options: STATES.map((s) => ({ value: s, label: s })),
    },
    {
      key: 'landSize',
      q: isHi ? 'आपके पास कितनी ज़मीन है?' : 'How much land do you own?',
      options: [
        { value: 'none', label: isHi ? 'कोई नहीं' : 'None' },
        { value: 'small', label: isHi ? 'छोटी (< 2 एकड़)' : 'Small (< 2 acres)' },
        { value: 'medium', label: isHi ? 'मध्यम (2–5 एकड़)' : 'Medium (2–5 acres)' },
        { value: 'large', label: isHi ? 'बड़ी (5+ एकड़)' : 'Large (5+ acres)' },
      ],
    },
    {
      key: 'age',
      q: isHi ? 'आपकी आयु क्या है?' : 'What is your age?',
      options: [
        { value: 'u18', label: isHi ? '18 से कम' : 'Under 18' },
        { value: '18_60', label: '18 – 60' },
        { value: 'o60', label: isHi ? '60 से अधिक' : 'Over 60' },
      ],
    },
  ] as const;

  const current = questions[step];

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              {labels.title}
            </CardTitle>
            <CardDescription className="mt-1">{labels.subtitle}</CardDescription>
          </div>
          {(submitted || step > 0) && (
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1 shrink-0">
              <RotateCcw className="h-3.5 w-3.5" />
              {labels.restart}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!submitted ? (
          <>
            {/* Progress */}
            <div className="flex gap-1.5 mb-4">
              {Array.from({ length: STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <h3 className="font-semibold mb-3">{current.q}</h3>

            <RadioGroup
              value={(answers as any)[current.key]}
              onValueChange={(v) => setAnswers({ ...answers, [current.key]: v })}
              className="grid gap-2 mb-4 max-h-64 overflow-y-auto pr-1"
            >
              {current.options.map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`opt-${opt.value}`}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors ${
                    (answers as any)[current.key] === opt.value ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <RadioGroupItem value={opt.value} id={`opt-${opt.value}`} />
                  <span className="text-sm font-medium">{opt.label}</span>
                </Label>
              ))}
            </RadioGroup>

            <div className="flex justify-between gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
              >
                {labels.back}
              </Button>
              <Button onClick={next} disabled={!canProceed()} className="gap-1">
                {step === STEPS - 1 ? labels.findSchemes : labels.next}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <h3 className="font-semibold text-base">{labels.youQualify}</h3>
            {matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">{labels.noMatches}</p>
            ) : (
              matches.map(({ scheme, reasons }) => {
                const name = isHi && scheme.name_hi ? scheme.name_hi : scheme.name_en;
                return (
                  <div
                    key={scheme.id}
                    className="rounded-lg border bg-background p-3 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => onOpenScheme(scheme.id)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm leading-snug">{name}</h4>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {reasons.map((r, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">
                          ✓ {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
