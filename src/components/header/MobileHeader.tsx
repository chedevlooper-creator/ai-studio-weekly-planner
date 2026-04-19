import { Download, Upload, LogOut, Zap, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { PlanStats } from './StatsCards';
import { SyncStatusIndicator, type SyncStatus } from './SyncStatusIndicator';

interface MobileHeaderProps {
  user: { email?: string } | null;
  stats: PlanStats;
  syncStatus: SyncStatus;
  activeUserId: string | null;
  onExport: () => void;
  onImport: () => void;
  onSignOut: () => void;
}

export function MobileHeader({ user, stats, syncStatus, activeUserId, onExport, onImport, onSignOut }: MobileHeaderProps) {
  const { resolved, toggle } = useTheme();
  return (
    <div className="flex flex-col gap-2.5 sm:hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-emerald-700 shadow-[0_2px_10px_rgba(16,185,129,0.3)]">
            <Zap className="size-4 text-white" aria-hidden />
          </div>
          <div>
            <h1 className="font-display text-base font-bold leading-tight tracking-tight text-white">Kafkasder</h1>
            <p className="text-[11px] text-zinc-400">Görev Takip</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <SyncStatusIndicator status={syncStatus} compact />
          <button
            type="button"
            onClick={toggle}
            className="inline-flex size-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/[0.07] hover:text-white active:scale-95"
            aria-label={resolved === 'dark' ? 'Açık tema' : 'Koyu tema'}
          >
            {resolved === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            type="button"
            disabled={!activeUserId}
            onClick={onExport}
            className="inline-flex size-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/[0.07] hover:text-white disabled:opacity-40 active:scale-95"
            aria-label="Dışa Aktar"
          >
            <Download className="size-4" />
          </button>
          <button
            type="button"
            disabled={!activeUserId}
            onClick={onImport}
            className="inline-flex size-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/[0.07] hover:text-white disabled:opacity-40 active:scale-95"
            aria-label="İçe Aktar"
          >
            <Upload className="size-4" />
          </button>
          {user && (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex size-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-400 active:scale-95"
              aria-label="Çıkış"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mini stats bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex min-h-[48px] items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
          <span className="text-[11px] text-zinc-400">Toplam</span>
          <span className="text-sm font-bold text-white tabular-nums">{stats.totalTasks}</span>
        </div>
        <div className="flex min-h-[48px] items-center justify-between rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-2">
          <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold text-emerald-400 tabular-nums">{stats.completed}</span>
        </div>
        <div className="flex min-h-[48px] flex-col justify-center gap-1 rounded-lg border border-accent/15 bg-accent/[0.06] px-2.5 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-accent-light/60">Oran</span>
            <span className="text-xs font-bold text-accent-light tabular-nums">%{stats.completionRate}</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400 transition-[width] duration-700"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
