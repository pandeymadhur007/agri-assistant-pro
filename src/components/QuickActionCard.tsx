import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  color?: string;
}

export function QuickActionCard({ icon: Icon, title, description, to, color = 'bg-primary' }: QuickActionCardProps) {
  return (
    <Link to={to}>
      <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary">
        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
          <div className={cn('p-4 rounded-full', color)}>
            <Icon className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
