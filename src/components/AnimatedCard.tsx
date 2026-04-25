import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  to: string;
  color?: string;
  gradient?: string;
  index?: number;
}

export function AnimatedCard({ 
  icon: Icon, 
  title, 
  description, 
  to, 
  color = 'bg-primary',
  gradient,
  index = 0
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        ease: 'easeOut'
      }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link to={to}>
        <Card className="h-full cursor-pointer border-0 shadow-md hover:shadow-xl overflow-hidden group transition-shadow duration-300">
          <CardContent className="p-4 flex flex-col items-center text-center gap-3">
            <motion.div 
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
                gradient ? `bg-gradient-to-br ${gradient}` : color
              )}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Icon className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">{title}</h3>
              {description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
