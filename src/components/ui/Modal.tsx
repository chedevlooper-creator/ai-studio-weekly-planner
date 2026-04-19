import { type ReactNode, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  variant?: 'dialog' | 'bottom-sheet';
  className?: string;
}

export function Modal({ open, onClose, title, children, variant = 'dialog', className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const el = contentRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className={cn(
        'fixed inset-0 z-[200] flex bg-black/60 backdrop-blur-sm print:hidden',
        variant === 'bottom-sheet' ? 'items-end justify-center sm:items-center sm:p-4' : 'items-center justify-center p-4',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div
        ref={contentRef}
        className={cn(
          'relative max-h-[95vh] overflow-y-auto border border-white/[0.08] bg-surface-1 shadow-lg',
          variant === 'bottom-sheet'
            ? 'w-full max-w-md rounded-t-2xl sm:rounded-2xl'
            : 'w-full max-w-md rounded-2xl',
          className,
        )}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ animation: variant === 'bottom-sheet' ? 'slideUp 0.2s ease-out' : 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {variant === 'bottom-sheet' && (
          <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-white/10 sm:hidden" aria-hidden />
        )}
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 id="modal-title" className="font-display text-lg font-bold text-white">{title}</h2>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-neutral-500 hover:bg-white/[0.08] hover:text-white transition-colors" aria-label="Kapat">
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className={cn(!title && 'pt-5', 'px-5 pb-5')}>
          {children}
        </div>
      </div>
    </div>
  );
}
