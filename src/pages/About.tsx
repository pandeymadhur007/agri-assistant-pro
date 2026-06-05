import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { SEO } from '@/components/SEO';
import { PageTransition } from '@/components/PageTransition';
import { Sprout, TrendingUp, CloudSun, FileText, Users, Camera } from 'lucide-react';

const features = [
  { icon: Camera, text: 'Detect crop diseases using AI' },
  { icon: TrendingUp, text: 'Get real-time mandi prices' },
  { icon: CloudSun, text: 'Receive weather forecasts and crop advisories' },
  { icon: FileText, text: 'Explore government schemes' },
  { icon: Sprout, text: 'Access crop and livestock guidance' },
  { icon: Users, text: 'Connect with other farmers through the community' },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title="About Gram AI — AI Farming Assistant" description="Gram AI is an AI-powered farming assistant helping Indian farmers grow better and earn more." path="/about" />
      <Navbar />
      <PageTransition>
        <main className="flex-1 container mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">About Gram AI</h1>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Gram AI is an AI-powered farming assistant designed to help farmers make smarter decisions and improve productivity. Our mission is to make modern agricultural knowledge accessible to every farmer through simple, reliable, and easy-to-use technology.
          </p>
          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">With Gram AI, farmers can:</h2>
          <ul className="grid sm:grid-cols-2 gap-3 mb-8">
            {features.map((f) => (
              <li key={f.text} className="flex items-start gap-3 p-4 rounded-2xl border border-border/60 bg-card/60">
                <span className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <f.icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-foreground/90 leading-snug">{f.text}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground leading-relaxed mb-8">
            We are building Gram AI to bridge the gap between technology and agriculture, empowering farmers with the information they need to grow better and earn more.
          </p>
          <div className="rounded-2xl border border-border/60 bg-primary/5 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Our Vision</h2>
            <p className="text-muted-foreground">To become every farmer's trusted digital companion.</p>
          </div>
        </main>
      </PageTransition>
      <Footer />
      <BottomNav />
    </div>
  );
}