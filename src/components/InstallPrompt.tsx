import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'gramai_install_dismissed_at';
const DISMISS_DAYS = 7;

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show in iframe preview environments
    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }
    // Already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Recently dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const ageMs = Date.now() - Number(dismissed);
      if (ageMs < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    } else {
      dismiss();
    }
    setDeferred(null);
  };

  if (!visible || !deferred) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:max-w-sm z-[60] animate-in slide-in-from-bottom-4">
      <div className="rounded-2xl border bg-background shadow-2xl shadow-primary/20 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Install Gram AI</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add to your home screen for quick, app-like access.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={install} className="h-8">Install</Button>
            <Button size="sm" variant="ghost" onClick={dismiss} className="h-8">Not now</Button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
