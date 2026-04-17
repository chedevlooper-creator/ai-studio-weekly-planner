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
    { label: 'Haftalık Hedef', placeholder: 'Bu haftanın ana hedefini yazın…', icon: '🎯' },
    { label: 'Önemli Notlar', placeholder: 'Dikkat edilmesi gereken notlar…', icon: '📌' },
    { label: 'İletişim / Koordinasyon', placeholder: 'İletişim bilgileri veya koordinasyon notları…', icon: '📞' },
    { label: 'Hatırlatma', placeholder: 'Unutulmaması gereken konular…', icon: '🔔' },
    { label: 'Diğer', placeholder: 'Ek notlar…', icon: '📝' },
  ];

  return (
    <section className="glass-panel p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between sm:mb-5">
        <h2 className="font-display text-sm font-bold text-white tracking-tight sm:text-base">
          <span className="mr-1.5">📋</span>
          Haftalık Notlar
        </h2>
        <span className="rounded-lg bg-accent/10 border border-accent/20 px-2 py-0.5 text-[9px] font-bold text-accent-light uppercase tracking-wider">
          Önemli
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        {reminders.map((text, i) => {
          const meta = NOTE_LABELS[i] ?? { label: `Not ${i + 1}`, placeholder: 'Yazın…', icon: '📝' };
          return (
            <div
              key={i}
              className="group flex flex-col gap-2 rounded-xl border border-white/[0.04] bg-white/[0.015] p-3 sm:p-4 transition-all hover:border-white/[0.08] hover:bg-white/[0.025]"
            >
              <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-500 group-focus-within:text-accent-light transition-colors sm:text-[10px]">
                <span>{meta.icon}</span>
                {meta.label}
              </label>
              <textarea
                value={text}
                onChange={(e) => onChange(i, e.target.value)}
                placeholder={meta.placeholder}
                rows={2}
                className="flex-1 resize-none rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-[12px] text-white/90 outline-none placeholder:text-neutral-700 focus:border-accent/30 focus:bg-white/[0.04] transition-all sm:text-sm sm:py-2.5"
                aria-label={meta.label}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
