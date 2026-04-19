import type { RefObject } from 'react';
import { Download, Upload, LogOut, Zap, User2 } from 'lucide-react';
import type { Assignee } from '../../types/plan';
import type { PlanStats } from './StatsCards';
import { StatsCards } from './StatsCards';
import { SyncStatusIndicator, type SyncStatus } from './SyncStatusIndicator';

interface DesktopHeaderProps {
  user: { email?: string } | null;
  stats: PlanStats;
  assigneeStats: { member: Assignee; assigned: number; done: number }[];
  syncStatus: SyncStatus;
  activeUserId: string | null;
  onExport: () => void;
  onImport: () => void;
  onSignOut: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

export function DesktopHeader({ user, stats, syncStatus, activeUserId, onExport, onImport, onSignOut }: DesktopHeaderProps) {
  return (
    <div className="hidden sm:flex flex-col gap-4">
      {/* Top row: brand + actions */}
      <div className="flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-violet-600 shadow-[0_2px_16px_rgba(99,102,241,0.35)]">
            <Zap className="size-5 text-white" aria-hidden />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold leading-tight tracking-tight text-white">Kafkasder</h1>
            <p className="text-[11px] font-medium text-slate-500 tracking-wide">Görev Takip Sistemi</p>
          </div>
          {/* Week badge */}
          <span className="ml-1 hidden md:inline-flex items-center rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-400">
            Haftalık Plan
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <SyncStatusIndicator status={syncStatus} compact />

          {user && (
            <span className="hidden lg:flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-xs text-slate-400">
              <User2 className="size-3.5 text-accent-light" />
              <span className="max-w-[160px] truncate">{user.email}</span>
            </span>
          )}

          <button
            type="button"
            disabled={!activeUserId}
            onClick={onExport}
            className="btn-ghost !py-1.5 !px-3 !text-xs disabled:opacity-40"
          >
            <Download className="size-3.5" aria-hidden />
            <span className="hidden lg:inline">Dışa Aktar</span>
          </button>
          <button
            type="button"
            disabled={!activeUserId}
            onClick={onImport}
            className="btn-ghost !py-1.5 !px-3 !text-xs disabled:opacity-40"
          >
            <Upload className="size-3.5" aria-hidden />
            <span className="hidden lg:inline">İçe Aktar</span>
          </button>
          {user && (
            <button
              type="button"
              onClick={onSignOut}
              className="btn-ghost !py-1.5 !px-3 !text-xs !text-slate-500 hover:!text-rose-400 hover:!border-rose-500/20"
              aria-label="Çıkış"
            >
              <LogOut className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <StatsCards stats={stats} />
    </div>
  );
}
