import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Wifi, WifiOff, Check, Share } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/Navbar';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: WifiOff,
      title: 'Works Offline',
      description: 'Access market prices, calendar, and chat history without internet'
    },
    {
      icon: Smartphone,
      title: 'Like a Real App',
      description: 'Install on your home screen, opens instantly without browser'
    },
    {
      icon: Download,
      title: 'No App Store',
      description: 'No download from Play Store or App Store needed'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Status Banner */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-6 ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <span className="text-sm font-medium">
            {isOnline ? 'You are online' : 'You are offline - cached data available'}
          </span>
        </div>

        {/* Install Card */}
        <Card className="mb-6 border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">🌾</span>
            </div>
            <CardTitle className="text-2xl">Install Gram AI</CardTitle>
            <CardDescription>
              Get the full app experience on your phone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInstalled ? (
              <div className="flex items-center justify-center gap-2 text-green-600 py-4">
                <Check className="h-6 w-6" />
                <span className="font-semibold">App Installed!</span>
              </div>
            ) : isIOS ? (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                  To install on iPhone/iPad:
                </p>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</span>
                    <span>Tap the <Share className="inline h-4 w-4" /> Share button in Safari</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</span>
                    <span>Scroll down and tap "Add to Home Screen"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</span>
                    <span>Tap "Add" to install</span>
                  </li>
                </ol>
              </div>
            ) : deferredPrompt ? (
              <Button 
                onClick={handleInstall} 
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Install App
              </Button>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Open this page in Chrome or Edge browser to install
              </p>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-center mb-4">Why Install?</h2>
          {features.map((feature, index) => (
            <Card key={index} className="border-green-100">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <feature.icon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Offline Data Info */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-800 mb-2">📱 Offline Features</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Market prices (cached for 24 hours)</li>
              <li>• Crop calendar & schedules</li>
              <li>• Previous chat history</li>
              <li>• Scan history & results</li>
              <li>• Government scheme information</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
