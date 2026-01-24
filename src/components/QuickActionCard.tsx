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
}

export function QuickActionCard({ icon: Icon, title, description, to, color = 'bg-primary' }: QuickActionCardProps) {
  return (
    <Link to={to}>
      <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border hover:border-primary/50">
        <CardContent className="p-4 flex flex-col items-center text-center gap-3">
          <div className={cn('p-3 rounded-full', color)}>
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
