import { Plus } from 'lucide-react';

interface FABProps {
  onAddTask?: () => void;
}

export function FloatingActionButton({ onAddTask }: FABProps) {
  return (
    <button
      type="button"
      onClick={onAddTask}
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] right-4 z-[50] flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-violet-600 shadow-[0_4px_24px_rgba(99,102,241,0.45),0_0_0_1px_rgba(255,255,255,0.08)_inset] transition-all hover:scale-105 hover:shadow-[0_6px_32px_rgba(99,102,241,0.6)] active:scale-95 sm:hidden"
      aria-label="Yeni görev ekle"
    >
      <Plus className="size-[22px] text-white" />
    </button>
  );
}
