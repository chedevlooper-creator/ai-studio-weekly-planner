/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 sm:px-2.5',
      'font-sans text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.08em] backdrop-blur-md',
      className
    )}>
      {children}
    </span>
  );
}
