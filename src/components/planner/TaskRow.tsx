/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo, useState } from 'react';
import { CheckCircle2, Circle, PlayCircle, GripVertical, Pencil, Paperclip, Loader2, AlertTriangle, Minus } from 'lucide-react';
import type { Task, TaskAttachment } from '../../types/plan';
import { cn } from '../../lib/utils';

const STATUS_CONFIG = {
  'Tamamlanan': {
    icon: CheckCircle2,
    iconClass: 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]',
    badgeClass: 'badge-status-done',
    label: 'Tamamlandı',
    rowClass: 'opacity-55',
  },
  'Devam Eden': {
    icon: PlayCircle,
    iconClass: 'text-blue-400',
    badgeClass: 'badge-status-inprogress',
    label: 'Devam Ediyor',
    rowClass: '',
  },
  'Bekliyor': {
    icon: Circle,
    iconClass: 'text-slate-600 group-hover/row:text-slate-400',
    badgeClass: 'badge-status-waiting',
    label: 'Bekliyor',
    rowClass: '',
  },
} as const;

const PRIORITY_CONFIG = {
  'Yüksek': {
    badgeClass: 'badge-high',
    dotClass: 'bg-rose-400',
    label: 'Yüksek',
    icon: AlertTriangle,
  },
  'Orta': {
    badgeClass: 'badge-medium',
    dotClass: 'bg-amber-400',
    label: 'Orta',
    icon: Minus,
  },
} as const;

export const TaskRow = memo(function TaskRow({
  task,
  dragEnabled,
  onToggleStatus,
  onEditTask,
  onQuickAttachFiles,
  onPreviewAttachment,
}: {
  task: Task;
  dragEnabled: boolean;
  onToggleStatus: () => void;
  onEditTask: () => void;
  onQuickAttachFiles: (files: FileList | File[]) => Promise<void>;
  onPreviewAttachment: (attachment: TaskAttachment) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !dragEnabled,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const statusCfg = STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const StatusIcon = statusCfg.icon;
  const isCompleted = task.status === 'Tamamlanan';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/row relative flex items-start gap-2.5 rounded-xl border bg-surface-2/40 px-3.5 py-3 sm:px-4',
        'border-white/[0.05] transition-all duration-200',
        'hover:border-white/[0.1] hover:bg-surface-2/70 hover:shadow-[0_2px_12px_rgba(0,0,0,0.35)]',
        isDragging && 'z-50 scale-[1.025] border-accent/35 bg-accent/[0.07] shadow-[0_8px_32px_rgba(99,102,241,0.2)]',
        statusCfg.rowClass,
      )}
    >
      {/* Left priority stripe */}
      <div className={cn(
        'absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full',
        priorityCfg.dotClass,
        'opacity-60',
      )} aria-hidden />

      {/* Drag handle */}
      {dragEnabled && (
        <button
          type="button"
          className="no-print mt-0.5 shrink-0 rounded p-0.5 text-slate-700 hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none select-none"
          aria-label="Sürükle"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" aria-hidden />
        </button>
      )}

      {/* Status toggle */}
      <button
        type="button"
        onClick={onToggleStatus}
        className="mt-0.5 shrink-0 transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label={isCompleted ? 'Geri al' : task.status === 'Devam Eden' ? 'Tamamla' : 'Başlat'}
      >
        <StatusIcon className={cn('size-[18px]', statusCfg.iconClass)} />
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Title */}
        <p className={cn(
          'text-sm font-medium leading-snug tracking-tight',
          isCompleted ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-100',
        )}>
          {task.title}
        </p>

        {/* Meta row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {/* Priority badge */}
          <span className={priorityCfg.badgeClass}>
            {priorityCfg.label}
          </span>

          {/* Assignee avatars */}
          <div className="flex items-center -space-x-1.5">
            {task.assignees.slice(0, 3).map((a) => (
              <span
                key={a.id}
                className={cn(
                  'flex size-4 items-center justify-center rounded-full border border-surface-1 text-[8px] font-bold',
                  a.color,
                )}
                title={a.name}
              >
                {a.name.charAt(0)}
              </span>
            ))}
            {task.assignees.length > 3 && (
              <span className="flex size-4 items-center justify-center rounded-full border border-surface-1 bg-surface-3 text-[7px] font-bold text-slate-400">
                +{task.assignees.length - 3}
              </span>
            )}
          </div>

          {/* Notes indicator */}
          {task.notes && (
            <span className="text-[10px] text-slate-600" title={task.notes}>📝</span>
          )}

          {/* Attachment pill */}
          {task.attachments.length > 0 && (
            <button
              type="button"
              onClick={() => onPreviewAttachment(task.attachments[0])}
              className="inline-flex items-center gap-0.5 rounded border border-accent/15 bg-accent/[0.07] px-1.5 py-0.5 text-[10px] text-accent-light hover:bg-accent/[0.12] transition-colors"
            >
              <Paperclip className="size-2.5" />
              {task.attachments.length}
            </button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="no-print flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 group-hover/row:opacity-100 transition-opacity mt-0.5">
        <label className="cursor-pointer rounded-lg p-1.5 text-slate-600 hover:bg-white/[0.07] hover:text-slate-200 transition-colors">
          {isUploading
            ? <Loader2 className="size-3.5 animate-spin text-accent-light" />
            : <Paperclip className="size-3.5" />
          }
          <input
            type="file"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = e.target.files;
              e.target.value = '';
              if (!files || files.length === 0) return;
              setIsUploading(true);
              try { await onQuickAttachFiles(files); } finally { setIsUploading(false); }
            }}
          />
        </label>
        <button
          type="button"
          onClick={onEditTask}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-white/[0.07] hover:text-slate-200 transition-colors"
          aria-label="Düzenle"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    </div>
  );
});
