/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, type FormEvent } from 'react';
import { Paperclip, X } from 'lucide-react';
import { TEAM } from '../../data/constants';
import { uploadTaskFile, TASK_FILES_BUCKET, MAX_TASK_FILE_SIZE } from '../../lib/insforgeStorage';
import type { DayTasks, Priority, Status, Task, TaskAttachment } from '../../types/plan';
import type { TaskModalState } from '../../hooks/useWeeklyPlan';

const STATUSES: Status[] = ['Bekliyor', 'Devam Eden', 'Tamamlanan'];
const PRIORITIES: Priority[] = ['Yüksek', 'Orta'];

export function TaskEditModal({
  modal,
  days,
  task,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  ownerId,
}: {
  modal: TaskModalState;
  days: DayTasks[];
  task: Task | null;
  onClose: () => void;
  onAdd: (dayIndex: number, fields: Omit<Task, 'id'>) => void;
  onUpdate: (dayIndex: number, taskId: string, fields: Omit<Task, 'id'>, moveToDayIndex?: number) => void;
  onDelete: (dayIndex: number, taskId: string) => void;
  ownerId: string | null;
}) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Status>('Bekliyor');
  const [priority, setPriority] = useState<Priority>('Yüksek');
  const [assigneeIds, setAssigneeIds] = useState<string[]>(TEAM.map((t) => t.id));
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [moveToDayIndex, setMoveToDayIndex] = useState(0);

  useEffect(() => {
    if (!modal) return;
    if (modal.mode === 'edit' && task) {
      setTitle(task.title);
      setNotes(task.notes);
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeIds(task.assignees.map((a) => a.id));
      setAttachments(task.attachments ?? []);
      setMoveToDayIndex(modal.dayIndex);
    } else {
      setTitle('');
      setNotes('');
      setStatus('Bekliyor');
      setPriority('Yüksek');
      setAssigneeIds(TEAM.map((t) => t.id));
      setAttachments([]);
      setMoveToDayIndex(modal.dayIndex);
    }
  }, [modal, task]);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, onClose]);

  if (!modal) return null;

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const buildFields = (): Omit<Task, 'id'> | null => {
    const t = title.trim();
    if (!t) return null;
    const assignees = TEAM.filter((m) => assigneeIds.includes(m.id));
    if (!assignees.length) return null;
    return {
      title: t,
      notes: notes.trim(),
      status,
      priority,
      assignees,
      attachments,
    };
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const fields = buildFields();
    if (!fields) return;
    setIsSaving(true);
    if (modal.mode === 'add') {
      onAdd(moveToDayIndex, fields);
    } else {
      onUpdate(modal.dayIndex, modal.taskId, fields, moveToDayIndex !== modal.dayIndex ? moveToDayIndex : undefined);
    }
    setIsSaving(false);
  };

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const next: TaskAttachment[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_TASK_FILE_SIZE) {
        window.alert(`${file.name} 5MB sınırını aşıyor.`);
        continue;
      }
      if (!ownerId) {
        window.alert('Dosya yüklemek için önce giriş yapın veya misafir modu açın.');
        return;
      }
      try {
        const uploaded = await uploadTaskFile(ownerId, file);
        next.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          mimeType: uploaded.mimeType || file.type || 'application/octet-stream',
          size: uploaded.size || file.size,
          bucket: TASK_FILES_BUCKET,
          key: uploaded.key,
          url: uploaded.url,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Dosya yüklenemedi.';
        window.alert(`${file.name}: ${msg}`);
      }
    }
    if (next.length) {
      setAttachments((prev) => [...prev, ...next]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div
        className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-white/[0.08] bg-surface-1 p-5 shadow-[0_-8px_48px_-12px_rgba(0,0,0,0.7)] sm:rounded-2xl sm:p-6"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        {/* Handle bar */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/10 sm:hidden" aria-hidden />
        
        <h2 id="task-modal-title" className="mb-5 font-display text-lg font-bold text-white">
          {modal.mode === 'add' ? '✨ Yeni Görev' : '✏️ Görevi Düzenle'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Day selector */}
          {modal.mode === 'add' && (
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">Gün</label>
              <select
                value={moveToDayIndex}
                onChange={(e) => setMoveToDayIndex(Number(e.target.value))}
                className="input-field"
              >
                {days.map((d, i) => (
                  <option key={d.day} value={i}>{d.day}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">Başlık</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Görev adı"
            />
          </div>

          {/* Status + Priority grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">Durum</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="input-field"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">Öncelik</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="input-field"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">Sorumlular</span>
            <div className="flex flex-wrap gap-2">
              {TEAM.map((m) => {
                const active = assigneeIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleAssignee(m.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                      active
                        ? 'border-accent/30 bg-accent/10 text-white shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                        : 'border-white/[0.06] bg-white/[0.02] text-neutral-500 hover:border-white/[0.12] hover:text-neutral-300'
                    }`}
                  >
                    <span className={`flex size-5 items-center justify-center rounded-full text-[9px] font-bold ${m.color}`}>
                      {m.name.charAt(0)}
                    </span>
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Move day */}
          {modal.mode === 'edit' && (
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">Gün (taşı)</label>
              <select
                value={moveToDayIndex}
                onChange={(e) => setMoveToDayIndex(Number(e.target.value))}
                className="input-field"
              >
                {days.map((d, i) => (
                  <option key={d.day} value={i}>{d.day}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">Notlar</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-field resize-y"
            />
          </div>

          {/* Files */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">Dosyalar</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.15] bg-white/[0.02] px-3 py-3 text-sm text-neutral-400 transition-all hover:border-accent/30 hover:bg-accent/[0.04] hover:text-accent-light">
              <Paperclip className="size-4" aria-hidden />
              Dosya yükle (max 5MB)
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFileSelect(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-neutral-300"
                  >
                    <span className="truncate">
                      {attachment.name} ({Math.max(1, Math.round(attachment.size / 1024))} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== attachment.id))}
                      className="rounded p-1 text-neutral-400 hover:bg-white/[0.08] hover:text-white transition-colors"
                      aria-label={`${attachment.name} dosyasını kaldır`}
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Kaydediliyor...' : '💾 Kaydet'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 sm:flex-none"
            >
              İptal
            </button>
            {modal.mode === 'edit' && (
              <button
                type="button"
                onClick={() => onDelete(modal.dayIndex, modal.taskId)}
                className="ml-auto px-4 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:text-rose-300 hover:underline"
              >
                🗑️ Sil
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
