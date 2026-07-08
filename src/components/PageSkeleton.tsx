import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-300">
      {/* Navbar skeleton */}
      <div className="h-16 border-b border-border/50 px-4 flex items-center justify-between">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="container mx-auto max-w-3xl px-4 pt-12 pb-8 text-center space-y-4">
        <Skeleton className="h-6 w-56 mx-auto rounded-full" />
        <Skeleton className="h-12 w-72 mx-auto rounded-xl" />
        <Skeleton className="h-5 w-96 max-w-full mx-auto rounded-md" />
        <div className="flex items-center justify-center gap-3 pt-4">
          <Skeleton className="h-12 w-36 rounded-2xl" />
          <Skeleton className="h-12 w-36 rounded-2xl" />
        </div>
      </div>

      {/* Content grid skeleton */}
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[168px] md:h-[180px] rounded-[20px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PageSkeleton;