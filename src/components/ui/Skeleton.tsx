import { cn } from '../../lib/utils';

export interface SkeletonProps {
  variant?: 'text' | 'circle' | 'card' | 'avatar' | 'button';
  className?: string;
  lines?: number;
}

export function Skeleton({ variant = 'text', className, lines = 1 }: SkeletonProps) {
  const base = 'animate-pulse rounded-lg bg-white/[0.06]';

  if (variant === 'circle') {
    return <div className={cn(base, 'size-10 rounded-full', className)} />;
  }
  if (variant === 'avatar') {
    return <div className={cn(base, 'size-8 rounded-full', className)} />;
  }
  if (variant === 'button') {
    return <div className={cn(base, 'h-10 w-24 rounded-xl', className)} />;
  }
  if (variant === 'card') {
    return (
      <div className={cn('rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 space-y-3', className)}>
        <div className={cn(base, 'h-4 w-3/4')} />
        <div className={cn(base, 'h-3 w-full')} />
        <div className={cn(base, 'h-3 w-2/3')} />
      </div>
    );
  }

  // text
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn(base, 'h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}
