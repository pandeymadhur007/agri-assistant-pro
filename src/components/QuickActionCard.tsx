import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  to: string;
  color?: string;
  gradient?: string;
}

export function QuickActionCard({ 
  icon: Icon, 
  title, 
  description, 
  to, 
  color = 'bg-primary',
  gradient 
}: QuickActionCardProps) {
  return (
    <Link to={to}>
      <Card className="h-full card-hover cursor-pointer border-0 shadow-md hover:shadow-xl overflow-hidden group">
        <CardContent className="p-4 flex flex-col items-center text-center gap-3">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300',
            gradient ? `bg-gradient-to-br ${gradient}` : color
          )}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
