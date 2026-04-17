/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo, useState } from 'react';
import { CheckCircle2, Circle, Clock, PlayCircle, CheckCircle, GripVertical, Pencil, Paperclip, Loader2 } from 'lucide-react';
import type { Task, TaskAttachment } from '../../types/plan';
import { cn } from '../../lib/utils';

import { Badge } from './Badge';

export const TaskRow = memo(function TaskRow({
  task,
  dragEnabled,
  editingNote,
  onToggleStatus,
  onNoteChange,
  onNoteEditorClose,
  onStartEditNote,
  onEditTask,
  onQuickAttachFiles,
  onPreviewAttachment,
}: {
  task: Task;
  dragEnabled: boolean;
  editingNote: boolean;
  onToggleStatus: () => void;
  onNoteChange: (notes: string) => void;
  onNoteEditorClose: () => void;
  onStartEditNote: () => void;
  onEditTask: () => void;
  onQuickAttachFiles: (files: FileList | File[]) => Promise<void>;
  onPreviewAttachment: (attachment: TaskAttachment) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !dragEnabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCompleted = task.status === 'Tamamlanan';
  const isInProgress = task.status === 'Devam Eden';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/row relative rounded-xl border border-white/[0.04] bg-white/[0.015] px-3 py-2.5 sm:px-4 sm:py-3 text-sm',
        'transition-all duration-200',
        'hover:border-white/[0.1] hover:bg-white/[0.03]',
        isDragging && 'z-50 scale-[1.02] border-accent/30 bg-accent/[0.06] shadow-glow',
        isCompleted && 'opacity-45'
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          'absolute left-0 top-3 bottom-3 w-[2px] rounded-full transition-all duration-300',
          isCompleted ? 'bg-emerald-500/60' : isInProgress ? 'bg-amber-400/60' : 'bg-white/[0.06] group-hover/row:bg-accent/40'
        )}
        aria-hidden
      />

      {/* Row 1: Title + status icon + actions */}
      <div className="flex items-center gap-2.5">
        {/* Drag handle */}
        <button
          type="button"
          className={cn(
            'no-print shrink-0 rounded-lg p-2 sm:p-1 text-neutral-600 transition-colors hover:bg-white/[0.06] hover:text-white focus:outline-none touch-none select-none',
            dragEnabled ? 'cursor-grab active:cursor-grabbing' : 'hidden'
          )}
          aria-label="Sürükle (uzun bas)"
          {...(dragEnabled ? { ...attributes, ...listeners } : {})}
        >
          <GripVertical className="size-3.5" aria-hidden />
        </button>

        {/* Status toggle */}
        <button
          type="button"
          onClick={onToggleStatus}
          className="shrink-0 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label={isCompleted ? 'Geri al' : 'Tamamla'}
        >
          {isCompleted ? (
            <CheckCircle2 className="size-[18px] text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.4)]" aria-hidden />
          ) : isInProgress ? (
            <PlayCircle className="size-[18px] text-amber-400 animate-pulse drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]" aria-hidden />
          ) : (
            <Circle className="size-[18px] text-neutral-600 group-hover/row:text-neutral-400 transition-colors" aria-hidden />
          )}
        </button>

        {/* Title */}
        <span
          className={cn(
            'flex-1 min-w-0 font-medium tracking-tight leading-snug text-[13px]',
            isCompleted ? 'text-neutral-500 line-through decoration-neutral-600' : 'text-white/90'
          )}
        >
          {task.title}
        </span>

        {/* Quick actions — always visible on touch, hover on desktop */}
        <div className="no-print flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 transition-opacity group-hover/row:opacity-100">
          <button
            type="button"
            onClick={onEditTask}
            className="shrink-0 rounded-lg p-1.5 text-neutral-500 hover:bg-white/[0.08] hover:text-white transition-colors"
            aria-label="Düzenle"
          >
            <Pencil className="size-3" aria-hidden />
          </button>
          <label className="shrink-0 cursor-pointer rounded-lg p-1.5 text-neutral-500 hover:bg-white/[0.08] hover:text-white transition-colors">
            {isUploading ? <Loader2 className="size-3 animate-spin text-accent-light" aria-hidden /> : <Paperclip className="size-3" aria-hidden />}
            <input
              type="file"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = e.target.files;
                e.target.value = '';
                if (!files || files.length === 0) return;
                setIsUploading(true);
                try {
                  await onQuickAttachFiles(files);
                } finally {
                  setIsUploading(false);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Row 2: Meta pills */}
      <div className="flex items-center flex-wrap gap-2 mt-2 pl-8">
        {/* Priority */}
        <Badge
          className={cn(
            'border-none font-semibold',
            task.priority === 'Yüksek'
              ? 'bg-rose-500/15 text-rose-400'
              : 'bg-amber-500/15 text-amber-300'
          )}
        >
          {task.priority === 'Yüksek' && <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />}
          {task.priority}
        </Badge>

        {/* Assignees — stacked avatars */}
        <div className="flex items-center -space-x-1">
          {task.assignees.map((assignee) => (
            <div
              key={assignee.id}
              className={cn(
                'flex size-5 items-center justify-center rounded-full border-2 border-surface-1 text-[8px] font-bold transition-transform hover:scale-110 hover:z-10',
                assignee.color
              )}
              title={assignee.name}
            >
              {assignee.name.charAt(0)}
            </div>
          ))}
        </div>

        {/* Status */}
        <div className={cn(
          'flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
          isCompleted ? 'text-emerald-400' : isInProgress ? 'text-amber-400' : 'text-neutral-500'
        )}>
          {task.status === 'Bekliyor' && <Clock className="size-2.5" />}
          {task.status === 'Devam Eden' && <PlayCircle className="size-2.5" />}
          {task.status === 'Tamamlanan' && <CheckCircle className="size-2.5" />}
          {task.status}
        </div>

        {/* Notes inline */}
        {editingNote ? (
          <textarea
            autoFocus
            rows={1}
            value={task.notes}
            onChange={(e) => onNoteChange(e.target.value)}
            onBlur={onNoteEditorClose}
            className="input-field !rounded-lg !py-1 !text-[11px] !px-2 flex-1 min-w-[120px]"
          />
        ) : task.notes ? (
          <button
            type="button"
            onClick={onStartEditNote}
            className="truncate max-w-[150px] rounded-lg border border-transparent px-1.5 py-0.5 text-left text-[10px] font-medium text-neutral-500 transition-colors hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-neutral-300"
          >
            📝 {task.notes}
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartEditNote}
            className="rounded-lg px-1.5 py-0.5 text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            + not
          </button>
        )}
      </div>
      
      {/* Attachments */}
      {task.attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-8">
          {task.attachments.map((attachment) => (
            <button
              key={attachment.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onPreviewAttachment(attachment);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium text-neutral-400 transition-all hover:border-accent/20 hover:bg-accent/[0.06] hover:text-accent-light"
            >
              <Paperclip className="size-2.5" />
              {attachment.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
