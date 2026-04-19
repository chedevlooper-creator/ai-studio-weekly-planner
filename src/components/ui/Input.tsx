import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, iconLeft, iconRight, className, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-500">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {iconLeft && (
            <span className="pointer-events-none absolute left-3 text-neutral-600">{iconLeft}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white outline-none transition-all',
              'placeholder:text-neutral-600 focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:bg-white/[0.04]',
              iconLeft && 'pl-9',
              iconRight && 'pr-9',
              error && 'border-rose-500/30 focus:border-rose-500/50 focus:ring-rose-500/10',
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {iconRight && (
            <span className="pointer-events-none absolute right-3 text-neutral-600">{iconRight}</span>
          )}
        </div>
        {error && <p id={`${inputId}-error`} className="text-xs text-rose-400" role="alert">{error}</p>}
        {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-neutral-600">{hint}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
