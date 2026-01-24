import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SchemeCard, useSchemes } from '@/components/SchemeCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText } from 'lucide-react';

const Schemes = () => {
  const { t } = useLanguage();
  const [category, setCategory] = useState<string>('');
  const { data: schemes, isLoading } = useSchemes(category || undefined);

  const categories = [
    { value: 'farmers', label: t('farmers') },
    { value: 'women', label: t('women') },
    { value: 'students', label: t('students') },
    { value: 'rural_workers', label: t('ruralWorkers') },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header with pattern */}
        <div className="hero-pattern bg-gradient-to-b from-purple-500/10 to-background py-8 px-4">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900 mb-3">
              <FileText className="w-7 h-7 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('schemes')}</h1>
            <p className="text-muted-foreground">Find government schemes for farmers and rural workers</p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <Select value={category} onValueChange={(val) => setCategory(val === 'all' ? '' : val)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories')}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schemes?.map(scheme => <SchemeCard key={scheme.id} scheme={scheme} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Schemes;
