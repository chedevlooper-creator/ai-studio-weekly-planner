/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function LuxuryCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'glass-panel transition-all duration-300',
        'hover:border-white/[0.12] hover:shadow-glass-hover',
        className
      )}
    >
      {children}
    </div>
  );
}
