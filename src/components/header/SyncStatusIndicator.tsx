import { Cloud, CloudOff, Check, HardDrive, Loader2 } from 'lucide-react';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'local-only';

export function SyncStatusIndicator({ status, compact = false }: { status: SyncStatus; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[10px]">
        {status === 'saving' && <><Loader2 className="size-3 animate-spin text-accent-light" /><span className="text-accent-light">…</span></>}
        {status === 'saved' && <><Cloud className="size-3 text-emerald-400" /><span className="text-emerald-400">✓</span></>}
        {status === 'error' && <><CloudOff className="size-3 text-rose-400" /><span className="text-rose-400">!</span></>}
        {status === 'local-only' && <><HardDrive className="size-3 text-amber-400" /><span className="text-amber-400/90">~</span></>}
        {status === 'idle' && <Check className="size-3 text-zinc-600" />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-xs backdrop-blur-md" aria-live="polite">
      {status === 'saving' && <><Loader2 className="size-4 animate-spin text-accent-light" aria-hidden /><span className="font-medium text-accent-light">İşleniyor…</span></>}
      {status === 'saved' && <><Cloud className="size-4 text-emerald-400" aria-hidden /><span className="font-medium text-emerald-300">Buluta Kaydedildi</span></>}
      {status === 'error' && <><CloudOff className="size-4 text-rose-400" aria-hidden /><span className="font-medium text-rose-300">Bağlantı Hatası</span></>}
      {status === 'local-only' && <><HardDrive className="size-4 text-amber-400" aria-hidden /><span className="font-medium text-amber-200/90">Yalnızca yerel (bulut yok)</span></>}
      {status === 'idle' && <><Check className="size-4 text-zinc-500" aria-hidden /><span className="font-medium text-zinc-500">Hazır</span></>}
    </div>
  );
}
