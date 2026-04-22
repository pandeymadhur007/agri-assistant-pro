import { Bell, X, AlertTriangle, Snowflake, Flame, CloudRain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useClimateAlerts, requestNotificationPermission } from '@/hooks/useClimateAlerts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

const iconFor = (type: string) => {
  switch (type) {
    case 'cold': return Snowflake;
    case 'frost': return Snowflake;
    case 'heatwave': return Flame;
    case 'rain': return CloudRain;
    default: return AlertTriangle;
  }
};

export function NotificationBell() {
  const { language } = useLanguage();
  const { alerts, unreadCount, markAllRead, dismiss } = useClimateAlerts(language);

  // Ask for notification permission once if user is logged in and has unseen alerts
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default' && unreadCount > 0) {
      requestNotificationPermission();
    }
  }, [unreadCount]);

  const t = (en: string, hi: string) => (language === 'hi' ? hi : en);

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open && unreadCount > 0) markAllRead(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full border-primary/50 text-primary" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full text-[10px] flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <span className="font-semibold text-sm">{t('Climate Alerts', 'मौसम चेतावनी')}</span>
          {alerts.length > 0 && (
            <span className="text-xs text-muted-foreground">{alerts.length}</span>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t('No active alerts', 'कोई सक्रिय चेतावनी नहीं')}
            </div>
          ) : (
            alerts.map(a => {
              const Icon = iconFor(a.alert_type);
              return (
                <div key={a.id} className={`px-3 py-3 border-b last:border-b-0 flex gap-3 ${a.is_read ? '' : 'bg-accent/30'}`}>
                  <Icon className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{a.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 break-words">{a.message}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(a.triggered_at), { addSuffix: true })}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); dismiss(a.id); }} aria-label="Dismiss">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
