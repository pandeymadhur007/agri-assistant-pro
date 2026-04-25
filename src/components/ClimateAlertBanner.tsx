import { AlertTriangle, X, Snowflake, Flame, CloudRain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

const colorFor = (type: string) => {
  switch (type) {
    case 'frost':
    case 'cold': return 'bg-card border-l-primary text-foreground';
    case 'heatwave': return 'bg-card border-l-destructive text-foreground';
    case 'rain': return 'bg-card border-l-primary text-foreground';
    default: return 'bg-card border-l-primary text-foreground';
  }
};

export function ClimateAlertBanner() {
  const { language } = useLanguage();
  const { alerts, dismiss } = useClimateAlerts(language);
  const top = alerts[0];
  if (!top) return null;
  const Icon = iconFor(top.alert_type);

  return (
    <Card className={`overflow-hidden shadow-md border border-border border-l-4 ${colorFor(top.alert_type)}`}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{top.title}</div>
          <p className="text-sm font-medium opacity-90 truncate">{top.message}</p>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => dismiss(top.id)} aria-label="Dismiss">
          <X className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
