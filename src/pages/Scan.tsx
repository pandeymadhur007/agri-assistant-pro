import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ImagePlus, Loader2, History, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCropScan } from '@/hooks/useCropScan';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { SEO } from '@/components/SEO';

const copy = {
  en: {
    heading: 'Scan your crop',
    sub: 'Take a clear photo of the affected leaf or plant. Diagnosis takes a few seconds.',
    camera: 'Take Photo',
    gallery: 'Upload Photo',
    analyze: 'Diagnose Now',
    change: 'Choose another photo',
    history: 'View past scans',
    tips: 'Tips for a good scan',
    tipList: [
      'Fill the frame with the affected leaf or stem',
      'Use daylight — avoid shadows and flash glare',
      'Keep the camera steady and in focus',
    ],
    stages: {
      compressing: 'Preparing image…',
      uploading: 'Uploading…',
      analyzing: 'Analysing with AI…',
      done: 'Done',
    },
    tooLarge: 'Image is too large. Please pick a photo under 15 MB.',
    notImage: 'Please select an image file.',
    failed: 'Scan failed',
    saved: 'Scan saved to your history',
  },
  hi: {
    heading: 'अपनी फसल स्कैन करें',
    sub: 'प्रभावित पत्ती या पौधे की साफ़ तस्वीर लें। निदान कुछ ही सेकंड में।',
    camera: 'फ़ोटो लें',
    gallery: 'फ़ोटो अपलोड करें',
    analyze: 'अभी निदान करें',
    change: 'दूसरी फ़ोटो चुनें',
    history: 'पिछले स्कैन देखें',
    tips: 'अच्छे स्कैन के लिए सुझाव',
    tipList: [
      'प्रभावित पत्ती या तने को पूरे फ्रेम में लें',
      'दिन के उजाले में लें — छाया और फ्लैश से बचें',
      'कैमरा स्थिर और फोकस में रखें',
    ],
    stages: {
      compressing: 'छवि तैयार हो रही है…',
      uploading: 'अपलोड हो रहा है…',
      analyzing: 'AI विश्लेषण चल रहा है…',
      done: 'पूर्ण',
    },
    tooLarge: 'छवि बहुत बड़ी है। 15 MB से छोटी फ़ोटो चुनें।',
    notImage: 'कृपया एक छवि फ़ाइल चुनें।',
    failed: 'स्कैन विफल',
    saved: 'स्कैन इतिहास में सहेजा गया',
  },
};

interface ScanProps {
  embedded?: boolean;
}

const MAX_BYTES = 15 * 1024 * 1024;

const Scan = ({ embedded = false }: ScanProps) => {
  const { language } = useLanguage();
  const t = copy[language as keyof typeof copy] || copy.en;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { scanImage, saveScanResult, isAnalyzing, stage, progress, error } = useCropScan();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const pick = (selected?: File | null) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      toast({ title: t.notImage, variant: 'destructive' });
      return;
    }
    if (selected.size > MAX_BYTES) {
      toast({ title: t.tooLarge, variant: 'destructive' });
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const run = async () => {
    if (!file) return;
    const result = await scanImage(file);
    if (!result) {
      toast({ title: t.failed, description: error ?? undefined, variant: 'destructive' });
      return;
    }
    void saveScanResult(result.imageUrl, result.diagnosis).then((id) => {
      if (id) toast({ title: t.saved });
    });
    navigate('/scan/result', {
      state: { imageUrl: result.imageDataUrl || result.imageUrl, diagnosis: result.diagnosis },
    });
  };

  const stageLabel = t.stages[stage as keyof typeof t.stages];

  const body = (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {!embedded && (
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">{t.heading}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
        </div>
      )}

      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          {preview ? (
            <div className="relative overflow-hidden rounded-2xl border border-border/60">
              <img src={preview} alt="Selected crop" loading="lazy" className="aspect-[4/3] w-full object-cover" />
              {!isAnalyzing && (
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={t.change}
                  className="absolute right-3 top-3 min-h-11 min-w-11 rounded-full"
                  onClick={reset}
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <ImagePlus className="h-10 w-10 text-primary" />
              <span className="px-6 text-center text-sm">{t.sub}</span>
            </button>
          )}

          {isAnalyzing && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>{stageLabel ?? t.stages.analyzing}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {!isAnalyzing && error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => cameraRef.current?.click()}
              disabled={isAnalyzing}
            >
              <Camera className="mr-2 h-4 w-4" /> {t.camera}
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => galleryRef.current?.click()}
              disabled={isAnalyzing}
            >
              <ImagePlus className="mr-2 h-4 w-4" /> {t.gallery}
            </Button>
          </div>

          <Button className="mt-3 min-h-12 w-full text-base" onClick={run} disabled={!file || isAnalyzing}>
            {isAnalyzing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {t.analyze}
          </Button>

          <Button
            variant="ghost"
            className="mt-2 min-h-11 w-full text-muted-foreground"
            onClick={() => navigate('/scan/history')}
          >
            <History className="mr-2 h-4 w-4" /> {t.history}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-5 rounded-2xl border border-border/60 bg-muted/40 p-4">
        <h2 className="mb-2 text-sm font-semibold text-foreground">{t.tips}</h2>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {t.tipList.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if (embedded) return body;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Scan Crop for Disease"
        description="Upload a crop photo and get an instant AI disease diagnosis with treatment and pesticide advice in your language."
      />
      <Navbar />
      <main className="flex-1">{body}</main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Scan;
