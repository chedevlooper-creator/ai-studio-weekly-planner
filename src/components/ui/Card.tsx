import type { HTMLAttributes, ReactNode } from 'react';
import type React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'interactive';
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ variant = 'glass', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border backdrop-blur-xl transition-all duration-300',
        variant === 'glass' && 'border-white/[0.06] bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] shadow-glass',
        variant === 'solid' && 'border-white/[0.06] bg-surface-2 shadow-card',
        variant === 'interactive' && 'border-white/[0.05] bg-[linear-gradient(135deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.005)_100%)] shadow-card cursor-pointer hover:border-white/[0.12] hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] hover:shadow-card-hover hover:-translate-y-px',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
