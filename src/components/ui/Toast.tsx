import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TOAST_AUTO_DISMISS_MS } from '../../data/constants';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  toast: (t: Omit<Toast, 'id'>) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), TOAST_AUTO_DISMISS_MS);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const ctx: ToastContextType = {
    toast: addToast,
    success: (message) => addToast({ type: 'success', message }),
    error: (message) => addToast({ type: 'error', message }),
    warning: (message) => addToast({ type: 'warning', message }),
    info: (message) => addToast({ type: 'info', message }),
  };

  const icons = { success: CheckCircle2, error: AlertCircle, warning: AlertTriangle, info: Info };
  const colors = {
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    error: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    info: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  };
  const iconColors = { success: 'text-emerald-400', error: 'text-rose-400', warning: 'text-amber-400', info: 'text-blue-400' };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] left-3 right-3 z-[300] flex flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm" aria-live="polite">
          {toasts.map((t) => {
            const Icon = icons[t.type];
            return (
              <div
                key={t.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-xl',
                  colors[t.type],
                )}
                role="alert"
                style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <Icon className={cn('size-5 shrink-0 mt-0.5', iconColors[t.type])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.message}</p>
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                      className="mt-1 text-xs font-semibold underline underline-offset-2 hover:no-underline"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 rounded-lg p-1 hover:bg-white/[0.1] transition-colors"
                  aria-label="Kapat"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
