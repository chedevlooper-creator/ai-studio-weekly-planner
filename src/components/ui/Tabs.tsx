import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  const [internal, setInternal] = useState(items[0]?.id ?? '');
  const activeId = value ?? internal;
  const handleChange = (id: string) => {
    if (onChange) onChange(id);
    else setInternal(id);
  };

  return (
    <div className={cn('flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1', className)} role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          role="tab"
          type="button"
          aria-selected={activeId === item.id}
          onClick={() => handleChange(item.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
            activeId === item.id
              ? 'bg-accent/15 text-accent-light shadow-sm'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]',
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
