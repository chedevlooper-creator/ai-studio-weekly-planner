/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Target, Pin, Phone, Bell, FileText, ClipboardList } from 'lucide-react';

export function RemindersPanel({
  reminders,
  onChange,
}: {
  reminders: string[];
  onChange: (index: number, value: string) => void;
}) {
  const NOTE_LABELS = [
    { label: 'Haftalık Hedef', placeholder: 'Bu haftanın ana hedefini yazın…', Icon: Target, accent: 'border-accent/15 focus:border-accent/35' },
    { label: 'Önemli Notlar', placeholder: 'Dikkat edilmesi gereken notlar…', Icon: Pin, accent: 'border-rose-500/15 focus:border-rose-500/30' },
    { label: 'İletişim / Koordinasyon', placeholder: 'İletişim bilgileri veya koordinasyon notları…', Icon: Phone, accent: 'border-blue-500/15 focus:border-blue-500/30' },
    { label: 'Hatırlatma', placeholder: 'Unutulmaması gereken konular…', Icon: Bell, accent: 'border-amber-500/15 focus:border-amber-500/30' },
    { label: 'Diğer', placeholder: 'Ek notlar…', Icon: FileText, accent: 'border-zinc-500/15 focus:border-zinc-500/30' },
  ] as const;

  return (
    <section className="glass-panel overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-3.5 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-accent/10 border border-accent/15">
            <ClipboardList className="size-3.5 text-accent-light" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-white tracking-tight">Haftalık Notlar</h2>
            <p className="text-[11px] text-zinc-400">Hedefler, hatırlatmalar ve koordinasyon</p>
          </div>
        </div>
        <span className="rounded-lg border border-accent/20 bg-accent/[0.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-light sm:hidden">
          Önemli
        </span>
      </div>

      {/* Notes grid */}
      <div className="grid grid-cols-1 gap-2.5 p-3 sm:p-5 lg:grid-cols-2 lg:gap-4">
        {reminders.map((text, i) => {
          const meta = NOTE_LABELS[i] ?? { label: `Not ${i + 1}`, placeholder: 'Yazın…', Icon: FileText, accent: 'border-zinc-500/15 focus:border-zinc-500/30' };
          const IconComponent = meta.Icon;
          return (
            <div
              key={i}
              className="group flex flex-col gap-1.5 rounded-xl border border-white/[0.05] bg-surface-2/40 p-3 transition-all hover:border-white/[0.09] hover:bg-surface-2/70 sm:gap-2 sm:p-4"
            >
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 group-focus-within:text-accent-light transition-colors sm:text-[11px]">
                <IconComponent className="size-3" />
                {meta.label}
              </label>
              <textarea
                value={text}
                onChange={(e) => onChange(i, e.target.value)}
                placeholder={meta.placeholder}
                rows={2}
                className={`min-h-[44px] flex-1 resize-none rounded-lg border bg-surface-1/60 px-3 py-2 text-[12px] text-zinc-100 outline-none placeholder:text-zinc-700 focus:bg-surface-1/90 transition-all sm:text-sm sm:py-2.5 ${meta.accent}`}
                aria-label={meta.label}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
