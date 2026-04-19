import { useState } from 'react';
import { cn } from '../../lib/utils';

export interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked = false, onChange, label, size = 'md', disabled, className }: ToggleProps) {
  const [internal, setInternal] = useState(checked);
  const isChecked = onChange ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (onChange) onChange(!isChecked);
    else setInternal((v) => !v);
  };

  return (
    <label className={cn('inline-flex items-center gap-2 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        onClick={toggle}
        disabled={disabled}
        className={cn(
          'relative inline-flex shrink-0 rounded-full transition-colors duration-200',
          size === 'sm' ? 'h-4 w-7' : 'h-5 w-9',
          isChecked ? 'bg-accent' : 'bg-white/[0.12]',
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
            size === 'sm' ? 'size-3 mt-0.5 ml-0.5' : 'size-4 mt-0.5 ml-0.5',
            isChecked && (size === 'sm' ? 'translate-x-3' : 'translate-x-4'),
          )}
        />
      </button>
      {label && <span className="text-sm text-neutral-300">{label}</span>}
    </label>
  );
}
