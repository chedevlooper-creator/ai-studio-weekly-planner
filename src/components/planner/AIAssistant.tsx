import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Bot, X, Sparkles, Loader2, Maximize2, Minimize2,
  Paperclip, FileText, Image as ImageIcon, FileJson, FileSpreadsheet,
  File as FileIcon, Square, ArrowDown, ClipboardList, CalendarDays, CheckCircle2, BarChart3,
} from 'lucide-react';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
import { useOpenClaw, type MessageAttachment } from '../../hooks/useOpenClaw';
import { FilePreviewModal } from './FilePreviewModal';
import { cn, formatBytes, TEXTUAL_MIME } from '../../lib/utils';
import { MAX_TASK_FILE_SIZE, MAX_IMAGE_DATAURL_SIZE, TOAST_AUTO_DISMISS_MS, TEXT_PREVIEW_CHARS } from '../../data/constants';
import type { DayTasks } from '../../types/plan';
import type { AiTaskDraft } from '../../lib/aiTaskDrafts';

interface AIPlanActions {
  data: DayTasks[];
  weekLabel: string;
  weekStart: string;
  addTasksFromAiDrafts: (drafts: AiTaskDraft[]) => { added: number; skipped: number };
}

interface AIAssistantProps {
  planActions: AIPlanActions;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const MAX_FILES = 5;

function iconFor(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon;
  if (mime.includes('json')) return FileJson;
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return FileSpreadsheet;
  if (mime.startsWith('text/') || mime.includes('pdf')) return FileText;
  return FileIcon;
}

const formatSize = formatBytes;

async function fileToAttachment(file: File): Promise<MessageAttachment> {
  const base: MessageAttachment = { name: file.name, size: file.size, mimeType: file.type || 'application/octet-stream' };
  if (base.mimeType.startsWith('image/') && file.size <= MAX_IMAGE_DATAURL_SIZE) {
    base.dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(file); });
  }
  if (TEXTUAL_MIME.test(base.mimeType) || /\.(md|txt|csv|log|json|ya?ml|js|ts|tsx|html|css)$/i.test(file.name)) {
    try { base.textPreview = (await file.text()).slice(0, TEXT_PREVIEW_CHARS); } catch {}
  }
  return base;
}

const SUGGESTIONS: { text: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { text: "Bu haftanın özetini çıkar", Icon: ClipboardList },
  { text: "Salı'ya toplantı ekle", Icon: CalendarDays },
  { text: 'Tamamlanan görevleri listele', Icon: CheckCircle2 },
  { text: 'Ekip performansını analiz et', Icon: BarChart3 },
];

export function AIAssistant({ planActions, open, onOpenChange }: AIAssistantProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = useCallback((next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  }, [onOpenChange]);
  const [inputMessage, setInputMessage] = useState('');
  const [pending, setPending] = useState<MessageAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [previewAtt, setPreviewAtt] = useState<(MessageAttachment & { __chat?: true }) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, sendMessage, stop, isConnected, isTyping, isStreaming } = useOpenClaw({
    data: planActions.data,
    weekLabel: planActions.weekLabel,
    weekStart: planActions.weekStart,
    addTasksFromAiDrafts: planActions.addTasksFromAiDrafts,
  });

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, setIsOpen]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth', block: 'end' });
    }
  }, [messages, isTyping, isOpen, isStreaming]);

  // Scroll detection for "scroll to bottom" button
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      setShowScrollBtn(!atBottom && messages.length > 3);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [messages.length]);

  useEffect(() => {
    if (!uploadError) return;
    const t = setTimeout(() => setUploadError(null), TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [uploadError]);

  const pendingLenRef = useRef(pending.length);
  pendingLenRef.current = pending.length;

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    const next: MessageAttachment[] = [];
    for (const f of files) {
      if (pendingLenRef.current + next.length >= MAX_FILES) { setUploadError(`En fazla ${MAX_FILES} dosya.`); break; }
      if (f.size > MAX_TASK_FILE_SIZE) { setUploadError(`"${f.name}" çok büyük.`); continue; }
      try { next.push(await fileToAttachment(f)); } catch { setUploadError(`"${f.name}" okunamadı.`); }
    }
    if (next.length > 0) setPending((prev) => [...prev, ...next].slice(0, MAX_FILES));
  }, []);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void addFiles(e.target.files);
    e.target.value = '';
  };

  const removeAttachment = (idx: number) => setPending((prev) => prev.filter((_, i) => i !== idx));

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    const trimmed = inputMessage.trim();
    if (!trimmed && pending.length === 0) return;
    sendMessage(trimmed, pending.length > 0 ? pending : undefined);
    setInputMessage('');
    setPending([]);
  };

  const sendSuggestion = (text: string) => {
    sendMessage(text);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Closed: FAB button ──
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed z-50 flex items-center justify-center rounded-2xl',
          'bg-gradient-to-br from-accent via-violet-600 to-violet-700 text-white',
          'shadow-[0_4px_24px_rgba(99,102,241,0.4),0_0_0_1px_rgba(255,255,255,0.08)_inset]',
          'transition-all hover:scale-105 hover:shadow-[0_6px_32px_rgba(99,102,241,0.55)] active:scale-95',
          'bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)] left-4 sm:bottom-6 sm:left-auto sm:right-6',
          // Pill shape on desktop, circle on mobile
          'size-12 sm:h-11 sm:w-auto sm:px-4 sm:gap-2 sm:rounded-xl',
        )}
        aria-label="AI Asistanı aç"
        aria-haspopup="dialog"
        aria-expanded="false"
      >
        <Bot className="size-5 shrink-0" />
        <span className="hidden sm:inline text-sm font-semibold">AI Asistan</span>
        <span className={cn(
          'absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2',
          'border-surface-0',
          isConnected ? 'bg-emerald-400' : 'bg-rose-400',
        )} />
      </button>
    );
  }

  // ── Open: Chat panel ──
  const panelClasses = isExpanded
    ? 'fixed inset-0 z-[100] sm:inset-4 md:inset-8 lg:inset-auto lg:bottom-6 lg:right-6 lg:h-[85vh] lg:w-[580px]'
    : 'fixed inset-0 z-[100] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[420px]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-assistant-title"
      className={cn(
        panelClasses,
        'flex flex-col',
        'bg-surface-0 sm:bg-surface-1/95 sm:backdrop-blur-2xl',
        'sm:border sm:border-white/[0.08] sm:rounded-2xl',
        'sm:shadow-[0_16px_64px_-8px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)_inset]',
        'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
      )}
      style={{ animation: 'slideUpFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget === e.target) setIsDragging(false); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files) void addFiles(e.dataTransfer.files); }}
    >
      {/* ─── Header ─── */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-violet-500/15 border border-accent/20">
            <Sparkles className="size-4 text-accent-light" />
          </div>
          <div>
            <h3 id="ai-assistant-title" className="text-sm font-bold text-white tracking-tight">AI Asistan</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn('size-1.5 rounded-full', isConnected ? 'bg-emerald-400' : 'bg-rose-400')} />
              <span className="text-[11px] text-zinc-400">{isConnected ? 'Çevrimiçi' : 'Bağlanıyor…'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => setIsExpanded(!isExpanded)}
            className="hidden sm:flex p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            aria-label={isExpanded ? 'Küçült' : 'Genişlet'}>
            {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
          <button type="button" onClick={() => { setIsExpanded(false); setIsOpen(false); }}
            className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            aria-label="Kapat">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div ref={scrollContainerRef} className="relative flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4" aria-label="AI konuşması">
        {/* Empty state with suggestions */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 py-8">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
              <Bot className="size-7 text-zinc-500" />
            </div>
            <div className="text-center max-w-[260px]">
              <p className="text-sm font-semibold text-white">Merhaba!</p>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                Görevlerinizi yönetmek için bana yazın.
              </p>
            </div>
            <div className="flex flex-col gap-2 max-w-[320px]">
              {SUGGESTIONS.map((s, i) => {
                const Icon = s.Icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendSuggestion(s.text)}
                    disabled={!isConnected}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-2.5 text-[11px] font-medium text-zinc-300 transition-all hover:border-accent/30 hover:bg-accent/[0.06] hover:text-accent-light disabled:opacity-40"
                  >
                    <Icon className="size-3.5 shrink-0 text-zinc-500" />
                    {s.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
              {/* Avatar */}
              {!isUser && (
                <div className="shrink-0 flex size-7 items-center justify-center rounded-full bg-accent/15 mt-0.5">
                  <Sparkles className="size-3.5 text-accent-light" />
                </div>
              )}

              {/* Bubble */}
              <div className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                isUser
                  ? 'bg-accent text-white rounded-br-lg'
                  : 'bg-white/[0.05] border border-white/[0.06] text-zinc-200 rounded-bl-lg',
              )}>
                {msg.text && (
                  <div className="whitespace-pre-wrap break-words">
                    <span dangerouslySetInnerHTML={{ __html: escapeHtml(msg.text) }} />
                    {!isUser && msg.streaming && (
                      <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-accent-light animate-pulse" />
                    )}
                  </div>
                )}

                {msg.attachments && msg.attachments.length > 0 && (
                  <div className={cn('flex flex-wrap gap-1.5', msg.text && 'mt-2')}>
                    {msg.attachments.map((att, i) => {
                      const Icon = iconFor(att.mimeType);
                      const isImage = att.mimeType.startsWith('image/') && att.dataUrl;
                      const canPreview = isImage || att.textPreview || att.mimeType === 'application/pdf';
                      return isImage ? (
                        <button key={i} type="button" onClick={() => setPreviewAtt({ ...att, __chat: true })} className="block overflow-hidden rounded-lg border border-white/10 cursor-pointer hover:border-accent/30 transition-colors">
                          <img src={att.dataUrl} alt={att.name} className="max-h-48 max-w-[280px] object-cover" />
                        </button>
                      ) : (
                        <button key={i} type="button"
                          onClick={canPreview ? () => setPreviewAtt({ ...att, __chat: true }) : undefined}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px]',
                            isUser ? 'bg-white/15' : 'bg-white/[0.04] border border-white/[0.06]',
                            canPreview && 'cursor-pointer hover:border-accent/30 hover:bg-accent/[0.06] transition-colors',
                          )}>
                          <Icon className="size-3 opacity-70" />
                          <span className="max-w-[140px] truncate">{att.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Inline text preview for text-like attachments */}
                {isUser && msg.attachments?.some((a) => a.textPreview) && (
                  <div className="mt-2 space-y-1.5">
                    {msg.attachments!.filter((a) => a.textPreview).map((att, i) => (
                      <div key={i} className="rounded-lg bg-black/20 border border-white/[0.06] overflow-hidden">
                        <div className="px-2 py-1 text-[10px] text-zinc-400 border-b border-white/[0.04] font-mono">{att.name}</div>
                        <pre className="px-2 py-1.5 text-[10px] leading-relaxed text-zinc-300 font-mono overflow-x-auto max-h-24 whitespace-pre-wrap break-words">
                          {att.textPreview!.length > 500 ? att.textPreview!.slice(0, 500) + '…' : att.textPreview}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && !messages.some((m) => m.role === 'assistant' && m.streaming && m.text) && (
          <div className="flex gap-2.5">
            <div className="shrink-0 flex size-7 items-center justify-center rounded-full bg-accent/15">
              <Sparkles className="size-3.5 text-accent-light" />
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-lg px-4 py-3 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="size-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '100ms' }} />
              <span className="size-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '200ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-px" />
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <button type="button" onClick={scrollToBottom}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex size-8 items-center justify-center rounded-full bg-surface-2 border border-white/[0.08] text-zinc-400 shadow-lg hover:text-white transition-colors"
          aria-label="En alta git">
          <ArrowDown className="size-4" />
        </button>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-accent/10 border-2 border-dashed border-accent/40 rounded-2xl">
          <span className="rounded-lg bg-surface-1/90 px-3 py-2 text-xs font-medium text-white">Dosyayı bırakın</span>
        </div>
      )}

      {/* ─── Input area ─── */}
      <div className="shrink-0 border-t border-white/[0.06] bg-surface-0/95 sm:bg-transparent">
        {/* Pending attachments */}
        {(pending.length > 0 || uploadError) && (
          <div className="px-3 pt-2.5 flex flex-wrap gap-1.5">
            {pending.map((att, i) => {
              const Icon = iconFor(att.mimeType);
              const isImage = att.mimeType.startsWith('image/') && att.dataUrl;
              return (
                <div key={i} className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] pl-1 pr-1.5 py-1 text-[11px] text-zinc-300">
                  {isImage
                    ? <img src={att.dataUrl} alt="" className="size-6 rounded object-cover" />
                    : <span className="flex size-6 items-center justify-center rounded bg-white/[0.04]"><Icon className="size-3 text-accent-light" /></span>
                  }
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <button type="button" onClick={() => removeAttachment(i)} className="size-4 flex items-center justify-center rounded text-zinc-500 hover:text-rose-400 transition-colors" aria-label="Kaldır">
                    <X className="size-3" />
                  </button>
                </div>
              );
            })}
            {uploadError && (
              <div className="w-full rounded-lg bg-amber-500/10 border border-amber-500/15 px-2.5 py-1.5 text-[10px] text-amber-300" role="alert">{uploadError}</div>
            )}
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSend} className="flex items-end gap-2 p-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] sm:pb-3">
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilePick} aria-hidden />

          <button type="button" onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected || pending.length >= MAX_FILES}
            className="shrink-0 flex size-9 items-center justify-center rounded-lg text-zinc-500 hover:text-accent-light hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
            aria-label="Dosya ekle">
            <Paperclip className="size-4" />
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              aria-label="AI asistana mesaj yaz"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={!isConnected}
              placeholder={isConnected ? 'Mesaj yazın…' : 'Bağlanıyor…'}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 px-3.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/10 disabled:opacity-40 transition-all"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {isStreaming ? (
            <button type="button" onClick={stop}
              className="shrink-0 flex size-9 items-center justify-center rounded-lg bg-rose-500 text-white hover:bg-rose-400 transition-colors"
              aria-label="Durdur">
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button type="submit"
              disabled={!isConnected || (!inputMessage.trim() && pending.length === 0)}
              className="shrink-0 flex size-9 items-center justify-center rounded-lg bg-accent text-white hover:bg-accent-light disabled:bg-white/[0.06] disabled:text-zinc-600 transition-colors"
              aria-label="Gönder">
              {isTyping ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          )}
        </form>

        {/* Safe area padding for mobile */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>

      {/* File preview modal */}
      <FilePreviewModal attachment={previewAtt} onClose={() => setPreviewAtt(null)} />
    </div>
  );
}
