import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { SEO } from '@/components/SEO';
import { PageTransition } from '@/components/PageTransition';

const sections = [
  {
    title: '1. Information We Collect',
    body: 'We may collect information such as your name, email address, language preferences, and usage data to improve our services. Uploaded crop images may be processed to provide disease detection and recommendations.',
  },
  {
    title: '2. How We Use Information',
    body: 'Your information helps us personalize advisories, generate AI recommendations, improve accuracy of crop scans, and deliver content in your preferred language.',
  },
  {
    title: '3. Data Security',
    body: 'We take reasonable technical and organizational measures to protect user data from unauthorized access, alteration, or disclosure.',
  },
  {
    title: '4. Third-Party Services',
    body: 'We rely on trusted third-party services (such as cloud hosting, AI models, and weather APIs) to power Gram AI. These providers process data strictly for their stated purpose. We do not sell personal information to third parties.',
  },
  {
    title: '5. Cookies and Analytics',
    body: 'We may use cookies and lightweight analytics to understand how the app is used and improve performance. You can disable cookies in your browser settings.',
  },
  {
    title: '6. User Rights',
    body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us. You may also update your language and profile preferences from within the app.',
  },
  {
    title: '7. Contact Information',
    body: 'For questions about this Privacy Policy, contact us at pandeymadhur007@gmail.com.',
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title="Privacy Policy — Gram AI" description="How Gram AI collects, uses, and protects your data." path="/privacy" />
      <Navbar />
      <PageTransition>
        <main className="flex-1 container mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Gram AI respects your privacy. By using Gram AI, you agree to this Privacy Policy.
          </p>
          <div className="space-y-6">
            {sections.map((s) => (
              <section key={s.title} className="rounded-2xl border border-border/60 bg-card/60 p-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </section>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-8">Last updated: June 2026</p>
        </main>
      </PageTransition>
      <Footer />
      <BottomNav />
    </div>
  );
}