import { Search, SlidersHorizontal } from 'lucide-react';
import type { RefObject } from 'react';
import { FILTER_OPTIONS } from '../../hooks/useWeeklyPlan';

interface FilterBarProps {
  filter: string;
  setFilter: (f: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export function FilterBar({ filter, setFilter, searchQuery, setSearchQuery, searchInputRef }: FilterBarProps) {
  const searchId = 'planner-search';

  return (
    <section className="no-print flex flex-col gap-2.5 rounded-2xl border border-white/[0.07] bg-surface-1/80 p-2.5 backdrop-blur-xl shadow-card sm:flex-row sm:items-center sm:gap-3 sm:p-3" aria-label="Filtreler ve arama">
      {/* Filter chips */}
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <SlidersHorizontal className="size-3.5 text-slate-500 shrink-0" aria-hidden />
        <div className="flex items-center gap-1">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                filter === f
                  ? 'bg-accent/15 text-accent-light border border-accent/20 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile select */}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full shrink-0 rounded-xl border border-white/[0.07] bg-surface-2 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-accent/30 sm:hidden"
        aria-label="Filtre"
      >
        {FILTER_OPTIONS.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      {/* Divider */}
      <div className="hidden sm:block h-5 w-px bg-white/[0.07]" aria-hidden />

      {/* Search */}
      <div className="relative flex w-full flex-1 items-center">
        <label htmlFor={searchId} className="sr-only">Görev ara</label>
        <Search className="pointer-events-none absolute left-3.5 size-4 text-slate-600" aria-hidden />
        <input
          id={searchId}
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Görev ara… (/ tuşu)"
          className="min-h-[44px] w-full rounded-xl border border-transparent bg-white/[0.03] py-2.5 pl-10 pr-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-accent/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-accent/10 transition-all"
          autoComplete="off"
          aria-controls="planner-grid"
        />
      </div>
    </section>
  );
}
