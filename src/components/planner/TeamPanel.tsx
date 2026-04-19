/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Users } from 'lucide-react';
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
    <section className={cn('glass-panel overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/15">
            <Users className="size-4 text-blue-400" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-white tracking-tight">Ekip Performansı</h2>
            <p className="text-[10px] text-slate-500">{assigneeStats.length} üye · Bu hafta</p>
          </div>
        </div>
        <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2 py-0.5 text-[9px] font-bold tabular-nums text-slate-500">
          {assigneeStats.reduce((s, x) => s + x.done, 0)} / {assigneeStats.reduce((s, x) => s + x.assigned, 0)}
        </span>
      </div>

      {/* Members */}
      <ul className={cn('flex flex-col gap-2 p-4', compact && 'gap-1.5 p-3')}>
        {assigneeStats.map(({ member, assigned, done }) => {
          const pct = assigned > 0 ? Math.round((done / assigned) * 100) : 0;
          const isComplete = done === assigned && assigned > 0;
          return (
            <li
              key={member.id}
              className="group flex items-center gap-3 rounded-xl border border-white/[0.04] bg-surface-2/40 px-3.5 py-3 transition-all hover:border-white/[0.09] hover:bg-surface-2/70"
            >
              {/* Avatar */}
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-transform group-hover:scale-105',
                  member.color,
                )}
              >
                {member.name.charAt(0)}
              </span>

              {/* Name + bar */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold tracking-tight text-slate-200 truncate">{member.name}</span>
                  <span className={cn(
                    'text-xs font-bold tabular-nums shrink-0',
                    isComplete ? 'text-emerald-400' : done > 0 ? 'text-accent-light' : 'text-slate-600',
                  )}>
                    {done}/{assigned}
                    {isComplete && <span className="ml-1 text-[10px]">✓</span>}
                  </span>
                </div>
                {assigned > 0 && (
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700 ease-out',
                        isComplete
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : 'bg-gradient-to-r from-accent to-violet-500',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Percent */}
              <span className={cn(
                'text-[11px] font-bold tabular-nums shrink-0 w-8 text-right',
                isComplete ? 'text-emerald-400' : 'text-slate-500',
              )}>
                %{pct}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
