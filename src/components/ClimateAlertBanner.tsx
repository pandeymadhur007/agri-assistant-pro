import { AlertTriangle, X, Snowflake, Flame, CloudRain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClimateAlerts } from '@/hooks/useClimateAlerts';
import { useLanguage } from '@/contexts/LanguageContext';

const iconFor = (type: string) => {
  switch (type) {
    case 'cold':
    case 'frost': return Snowflake;
    case 'heatwave': return Flame;
    case 'rain': return CloudRain;
    default: return AlertTriangle;
  }
};

export function ClimateAlertBanner() {
  const { language } = useLanguage();
  const { alerts, dismiss } = useClimateAlerts(language);
  const top = alerts[0];
  if (!top) return null;
  const Icon = iconFor(top.alert_type);

  return (
    <div className="field-advisory px-4 py-3.5 flex items-center gap-4">
      <Icon className="w-6 h-6 shrink-0 text-foreground" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <div className="eyebrow mb-0.5">Alert</div>
        <div className="font-display font-semibold text-[15px] text-foreground">{top.title}</div>
        <p className="text-sm text-muted-foreground truncate">{top.message}</p>
      </div>
      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => dismiss(top.id)} aria-label="Dismiss">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
