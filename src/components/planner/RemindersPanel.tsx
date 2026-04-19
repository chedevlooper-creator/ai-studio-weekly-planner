/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function RemindersPanel({
  reminders,
  onChange,
}: {
  reminders: string[];
  onChange: (index: number, value: string) => void;
}) {
  const NOTE_LABELS = [
    { label: 'Haftalık Hedef', placeholder: 'Bu haftanın ana hedefini yazın…', icon: '🎯', accent: 'border-accent/15 focus:border-accent/35' },
    { label: 'Önemli Notlar', placeholder: 'Dikkat edilmesi gereken notlar…', icon: '📌', accent: 'border-rose-500/15 focus:border-rose-500/30' },
    { label: 'İletişim / Koordinasyon', placeholder: 'İletişim bilgileri veya koordinasyon notları…', icon: '📞', accent: 'border-blue-500/15 focus:border-blue-500/30' },
    { label: 'Hatırlatma', placeholder: 'Unutulmaması gereken konular…', icon: '🔔', accent: 'border-amber-500/15 focus:border-amber-500/30' },
    { label: 'Diğer', placeholder: 'Ek notlar…', icon: '📝', accent: 'border-slate-500/15 focus:border-slate-500/30' },
  ];

  return (
    <section className="glass-panel overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-accent/10 border border-accent/15">
            <span className="text-sm">📋</span>
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-white tracking-tight">Haftalık Notlar</h2>
            <p className="text-[10px] text-slate-500">Hedefler, hatırlatmalar ve koordinasyon</p>
          </div>
        </div>
        <span className="rounded-lg border border-accent/20 bg-accent/[0.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-light">
          Önemli
        </span>
      </div>

      {/* Notes grid */}
      <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 lg:grid-cols-2 lg:gap-4">
        {reminders.map((text, i) => {
          const meta = NOTE_LABELS[i] ?? { label: `Not ${i + 1}`, placeholder: 'Yazın…', icon: '📝', accent: 'border-slate-500/15 focus:border-slate-500/30' };
          return (
            <div
              key={i}
              className="group flex flex-col gap-2 rounded-xl border border-white/[0.05] bg-surface-2/40 p-3.5 sm:p-4 transition-all hover:border-white/[0.09] hover:bg-surface-2/70"
            >
              <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 group-focus-within:text-accent-light transition-colors sm:text-[10px]">
                <span>{meta.icon}</span>
                {meta.label}
              </label>
              <textarea
                value={text}
                onChange={(e) => onChange(i, e.target.value)}
                placeholder={meta.placeholder}
                rows={2}
                className={`flex-1 resize-none rounded-lg border bg-surface-1/60 px-3 py-2 text-[12px] text-slate-200 outline-none placeholder:text-slate-700 focus:bg-surface-1/90 transition-all sm:text-sm sm:py-2.5 ${meta.accent}`}
                aria-label={meta.label}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
