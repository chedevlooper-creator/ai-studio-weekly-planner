import React, { memo } from 'react';
import { CheckCircle2, Clock, Activity, TrendingUp } from 'lucide-react';

export interface PlanStats {
  totalTasks: number;
  completed: number;
  inProgress: number;
  waiting: number;
  completionRate: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  cardClass: string;
  valueClass: string;
  labelClass: string;
  iconClass: string;
  suffix?: string;
  bar?: { value: number; colorClass: string };
}

function StatCard({ label, value, icon, cardClass, valueClass, labelClass, iconClass, suffix, bar }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${cardClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${labelClass}`}>{label}</p>
          <div className="mt-1.5 flex items-baseline gap-0.5">
            <span className={`font-display text-2xl font-bold leading-none tabular-nums ${valueClass}`}>{value}</span>
            {suffix && <span className={`text-xs font-semibold ${valueClass} opacity-70`}>{suffix}</span>}
          </div>
        </div>
        <div className={`flex size-8 items-center justify-center rounded-lg ${iconClass}`}>
          {icon}
        </div>
      </div>
      {bar && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-black/20">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ${bar.colorClass}`}
            style={{ width: `${bar.value}%` }}
          />
        </div>
      )}
    </div>
  );
}

export const StatsCards = memo(function StatsCards({ stats }: { stats: PlanStats }) {
  return (
    <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4 lg:max-w-2xl">
      <StatCard
        label="Toplam"
        value={stats.totalTasks}
        icon={<Activity className="size-4 text-accent-light" />}
        cardClass="stat-card-total"
        valueClass="text-white"
        labelClass="text-accent-light/60"
        iconClass="bg-accent/10"
      />
      <StatCard
        label="Tamamlanan"
        value={stats.completed}
        icon={<CheckCircle2 className="size-4 text-emerald-400" />}
        cardClass="stat-card-done"
        valueClass="text-emerald-400"
        labelClass="text-emerald-400/60"
        iconClass="bg-emerald-500/10"
      />
      <StatCard
        label="Devam Eden"
        value={stats.inProgress}
        icon={<Clock className="size-4 text-amber-400" />}
        cardClass="stat-card-progress"
        valueClass="text-amber-400"
        labelClass="text-amber-400/60"
        iconClass="bg-amber-500/10"
      />
      <StatCard
        label="Tamamlanma"
        value={stats.completionRate}
        suffix="%"
        icon={<TrendingUp className="size-4 text-sky-400" />}
        cardClass="stat-card-rate"
        valueClass="text-sky-400"
        labelClass="text-sky-400/60"
        iconClass="bg-sky-500/10"
        bar={{ value: stats.completionRate, colorClass: 'bg-gradient-to-r from-sky-500 to-accent' }}
      />
    </div>
  );
});

const StatsPills = memo(function StatsPills({ stats }: { stats: PlanStats }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-lg border border-accent/15 bg-accent/[0.07] px-2 py-1 text-[10px] font-bold tabular-nums text-accent-light">
        <Activity className="size-2.5" />
        {stats.totalTasks}
      </span>
      <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.07] px-2 py-1 text-[10px] font-bold tabular-nums text-emerald-400">
        <CheckCircle2 className="size-2.5" />
        {stats.completed}
      </span>
      <span className="inline-flex items-center gap-1 rounded-lg border border-sky-500/15 bg-sky-500/[0.07] px-2 py-1 text-[10px] font-bold tabular-nums text-sky-400">
        %{stats.completionRate}
      </span>
    </div>
  );
});
