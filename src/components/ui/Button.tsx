import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1',
          // Variants
          variant === 'primary' && 'bg-accent text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_0_16px_rgba(99,102,241,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-accent-light hover:shadow-[0_2px_8px_rgba(0,0,0,0.3),0_0_24px_rgba(99,102,241,0.3)] hover:-translate-y-px',
          variant === 'ghost' && 'border border-white/[0.08] bg-white/[0.03] text-neutral-300 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white',
          variant === 'danger' && 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300',
          variant === 'icon' && 'text-neutral-500 hover:bg-white/[0.08] hover:text-white',
          // Sizes
          size === 'sm' && 'h-8 rounded-lg px-3 text-xs',
          size === 'md' && 'h-10 rounded-xl px-4 text-sm',
          size === 'lg' && 'h-12 rounded-xl px-6 text-base',
          variant === 'icon' && size === 'sm' && 'size-8 p-0',
          variant === 'icon' && size === 'md' && 'size-10 p-0',
          variant === 'icon' && size === 'lg' && 'size-12 p-0',
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
