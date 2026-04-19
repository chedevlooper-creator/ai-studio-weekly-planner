import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, color, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold transition-transform hover:scale-110',
        size === 'sm' && 'size-5 text-[8px]',
        size === 'md' && 'size-7 text-[10px]',
        size === 'lg' && 'size-9 text-xs',
        color || 'bg-accent/20 text-accent-light',
        className,
      )}
      title={name}
    >
      {name.charAt(0)}
    </div>
  );
}

export function AvatarGroup({ children, max = 4, className }: { children: ReactNode; max?: number; className?: string }) {
  const items = Array.isArray(children) ? children : [children];
  const visible = items.slice(0, max);
  const overflow = items.length - max;

  return (
    <div className={cn('flex items-center -space-x-1', className)}>
      {visible.map((child, i) => (
        <div key={i} className="border-2 border-surface-1 rounded-full">{child}</div>
      ))}
      {overflow > 0 && (
        <div className="flex size-5 items-center justify-center rounded-full border-2 border-surface-1 bg-surface-3 text-[8px] font-bold text-neutral-400">
          +{overflow}
        </div>
      )}
    </div>
  );
}
