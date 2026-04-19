/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, type FormEvent } from 'react';
import { Paperclip, X } from 'lucide-react';
import { TEAM } from '../../data/constants';
import { uploadTaskFile, TASK_FILES_BUCKET, MAX_TASK_FILE_SIZE } from '../../lib/insforgeStorage';
import { STATUSES, PRIORITIES, type DayTasks, type Priority, type Status, type Task, type TaskAttachment } from '../../types/plan';
import type { TaskModalState } from '../../hooks/useWeeklyPlan';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

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
    try {
      if (modal.mode === 'add') {
        onAdd(moveToDayIndex, fields);
      } else {
        onUpdate(modal.dayIndex, modal.taskId, fields, moveToDayIndex !== modal.dayIndex ? moveToDayIndex : undefined);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const next: TaskAttachment[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_TASK_FILE_SIZE) {
        toast.warning(`${file.name} 5MB sınırını aşıyor.`);
        continue;
      }
      if (!ownerId) {
        toast.error('Dosya yüklemek için önce giriş yapın veya misafir modu açın.');
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
        toast.error(`${file.name}: ${msg}`);
      }
    }
    if (next.length) {
      setAttachments((prev) => [...prev, ...next]);
    }
  };

  return (
    <>
    <Modal
      open={!!modal}
      onClose={onClose}
      title={modal.mode === 'add' ? '✨ Yeni Görev' : '✏️ Görevi Düzenle'}
      variant="bottom-sheet"
    >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)]">
          {/* Day selector */}
          {modal.mode === 'add' && (
            <div>
              <label htmlFor="task-day" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Gün</label>
              <select
                id="task-day"
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
            <label htmlFor="task-title" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Başlık</label>
            <input
              id="task-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Görev adı"
            />
          </div>

          {/* Status + Priority grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="task-status" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Durum</label>
              <select
                id="task-status"
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
              <label htmlFor="task-priority" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Öncelik</label>
              <select
                id="task-priority"
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
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Sorumlular</span>
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
                        ? 'border-accent/30 bg-accent/10 text-white shadow-[0_0_12px_rgba(124,131,255,0.14)]'
                        : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-300'
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
              <label htmlFor="task-move-day" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Gün (taşı)</label>
              <select
                id="task-move-day"
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
            <label htmlFor="task-notes" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Notlar</label>
            <textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-field resize-y"
            />
          </div>

          {/* Files */}
          <div>
            <label htmlFor="task-files" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Dosyalar</label>
            <label htmlFor="task-files" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.15] bg-white/[0.02] px-3 py-3 text-sm text-zinc-400 transition-all hover:border-accent/30 hover:bg-accent/[0.04] hover:text-accent-light">
              <Paperclip className="size-4" aria-hidden />
              Dosya yükle (max 5MB)
              <input
                id="task-files"
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
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-zinc-300"
                  >
                    <span className="truncate">
                      {attachment.name} ({Math.max(1, Math.round(attachment.size / 1024))} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== attachment.id))}
                      className="rounded p-1 text-zinc-400 hover:bg-white/[0.08] hover:text-white transition-colors"
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
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:flex-wrap">
            <Button
              type="submit"
              variant="primary"
              loading={isSaving}
              className="w-full sm:w-auto sm:flex-none"
            >
              💾 Kaydet
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full sm:w-auto sm:flex-none"
            >
              İptal
            </Button>
            {modal.mode === 'edit' && !confirmDelete && (
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() => setConfirmDelete(true)}
                className="w-full sm:ml-auto sm:w-auto"
              >
                🗑️ Sil
              </Button>
            )}
          </div>
        </form>
    </Modal>

    {/* Delete confirmation */}
    {modal.mode === 'edit' && confirmDelete && (
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="🗑️ Görevi Sil">
        <div className="px-5 pb-5">
          <p className="text-sm text-zinc-300">
            <span className="font-semibold text-white">{task?.title}</span> görevini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              className="flex-1"
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => { onDelete(modal.dayIndex, modal.taskId); setConfirmDelete(false); }}
              className="flex-1"
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    )}
    </>
  );
}
