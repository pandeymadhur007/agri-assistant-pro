import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SchemeCard, useSchemes } from '@/components/SchemeCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

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
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('schemes')}</h1>
        
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schemes?.map(scheme => <SchemeCard key={scheme.id} scheme={scheme} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Schemes;
