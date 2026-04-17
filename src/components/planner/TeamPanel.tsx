/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Assignee } from '../../types/plan';
import { cn } from '../../lib/utils';

export function TeamPanel({
  assigneeStats,
  compact = false,
  className = '',
}: {
  assigneeStats: { member: Assignee; assigned: number; done: number }[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'glass-panel flex flex-col',
        compact ? 'p-3 sm:p-4' : 'p-4 sm:p-6',
        className
      )}
    >
      <div className={cn('flex items-center justify-between gap-3', compact ? 'mb-3' : 'mb-4')}>
        <h2 className={cn('font-display font-bold text-white', compact ? 'text-[13px] sm:text-sm' : 'text-sm sm:text-base')}>
          <span className="mr-1.5">👥</span>
          Ekip Performansı
        </h2>
        <span className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-neutral-500 tabular-nums">
          {assigneeStats.length} Üye
        </span>
      </div>
      <ul className={cn('flex flex-col', compact ? 'gap-2' : 'gap-2.5')}>
        {assigneeStats.map(({ member, assigned, done }) => {
          const pct = assigned > 0 ? Math.round((done / assigned) * 100) : 0;
          const isComplete = done === assigned && assigned > 0;
          return (
            <li
              key={member.id}
              className={cn(
                'group relative flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.015] transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.03]',
                compact ? 'px-3 py-2.5 text-[12px]' : 'px-3.5 py-3 text-[13px] sm:px-4 sm:py-3.5 sm:text-sm'
              )}
            >
              <span className="flex items-center gap-2.5 font-semibold text-neutral-200">
                <span className={cn(
                  'flex size-7 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm transition-transform group-hover:scale-110 sm:size-8 sm:text-[11px]',
                  member.color
                )}>
                  {member.name.charAt(0)}
                </span>
                <span className="tracking-tight">{member.name}</span>
              </span>
              <div className="flex flex-col items-end gap-1.5 min-w-[80px]">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-display font-bold tabular-nums text-xs sm:text-sm',
                      isComplete ? 'text-emerald-400' : done > 0 ? 'text-accent-light' : 'text-neutral-500'
                    )}
                  >
                    {done}/{assigned}
                  </span>
                  {isComplete && <span className="text-[10px]">✓</span>}
                </div>
                {assigned > 0 && (
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700 ease-out',
                        isComplete ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-accent to-accent-light'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
