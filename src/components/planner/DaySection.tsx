/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, Plus } from 'lucide-react';
import type { DayTasks, TaskAttachment } from '../../types/plan';
import { taskVisible } from '../../lib/planFilters';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import { TaskRow } from './TaskRow';
import { EmptyState } from '../ui/EmptyState';

const DAY_COLORS: Record<string, { dot: string; accent: string; text: string }> = {
  Pazartesi: { dot: 'bg-indigo-500', accent: 'rgba(99,102,241,0.55)', text: 'text-indigo-400' },
  Salı: { dot: 'bg-blue-500', accent: 'rgba(59,130,246,0.55)', text: 'text-blue-400' },
  Çarşamba: { dot: 'bg-emerald-500', accent: 'rgba(16,185,129,0.55)', text: 'text-emerald-400' },
  Perşembe: { dot: 'bg-amber-500', accent: 'rgba(245,158,11,0.55)', text: 'text-amber-400' },
  Cuma: { dot: 'bg-orange-500', accent: 'rgba(249,115,22,0.55)', text: 'text-orange-400' },
  Cumartesi: { dot: 'bg-violet-500', accent: 'rgba(139,92,246,0.55)', text: 'text-violet-400' },
  Pazar: { dot: 'bg-slate-500', accent: 'rgba(100,116,139,0.55)', text: 'text-slate-400' },
};

function DayAppendDropZone({ dayIndex, disabled }: { dayIndex: number; disabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-append-${dayIndex}`, disabled });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'no-print -mx-1 min-h-4 rounded-lg border border-dashed px-1 transition-all duration-200',
        disabled ? 'pointer-events-none border-transparent' : 'border-white/[0.04]',
        isOver && !disabled && 'border-accent/30 bg-accent/[0.04]'
      )}
      aria-hidden
    />
  );
}

export function DaySection({
  dayData,
  dayIndex,
  expanded,
  onToggleExpand,
  filter,
  searchQuery,
  dragEnabled,
  editingNote: _editingNote,
  onToggleTaskStatus,
  onUpdateTaskNotes: _onUpdateTaskNotes,
  onEditingNoteClose: _onEditingNoteClose,
  onStartEditNote: _onStartEditNote,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onQuickAttachFiles,
  onPreviewAttachment,
}: {
  dayData: DayTasks;
  dayIndex: number;
  expanded: boolean;
  onToggleExpand: () => void;
  filter: string;
  searchQuery: string;
  dragEnabled: boolean;
  editingNote: { dayIndex: number; taskId: string } | null;
  onToggleTaskStatus: (taskId: string) => void;
  onUpdateTaskNotes: (taskId: string, notes: string) => void;
  onEditingNoteClose: () => void;
  onStartEditNote: (taskId: string) => void;
  onAddTask: () => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onQuickAttachFiles: (taskId: string, files: FileList | File[]) => Promise<void>;
  onPreviewAttachment: (attachment: TaskAttachment) => void;
}) {
  const visibleTasks = dayData.tasks.filter((t) => taskVisible(t, filter, searchQuery));
  const sortableIds = dayData.tasks.map((t) => t.id);
  const completedCount = dayData.tasks.filter((t) => t.status === 'Tamamlanan').length;
  const totalCount = dayData.tasks.length;
  const dayColor = DAY_COLORS[dayData.day] ?? { dot: 'bg-accent', accent: 'rgba(99,102,241,0.55)', text: 'text-accent-light' };
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const panelId = `day-panel-${dayIndex}`;

  return (
    <Card
      variant="glass"
      className={cn(
        'day-col-accent overflow-hidden flex flex-col',
        expanded && 'ring-1 ring-white/[0.07]',
      )}
      style={{ '--day-accent-color': dayColor.accent } as React.CSSProperties}
    >
      {/* Day header */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="group flex w-full cursor-pointer items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-white/[0.025]"
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <span className="flex items-center gap-2.5">
          <span className={cn('size-2 rounded-full shrink-0', dayColor.dot)} />
          <span className="font-display text-sm font-bold tracking-tight text-white sm:text-base">
            {dayData.day}
          </span>
          {totalCount > 0 && (
            <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums', dayColor.text, 'bg-white/[0.04]')}>
              {completedCount}/{totalCount}
            </span>
          )}
        </span>

        <span className="flex items-center gap-2.5">
          {/* Mini progress bar */}
          {totalCount > 0 && (
            <div className="hidden sm:block h-1 w-16 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${progress}%`, background: dayColor.accent }}
              />
            </div>
          )}
          <ChevronDown
            className={cn(
              'size-4 transition-transform duration-200',
              expanded ? 'rotate-180 text-accent-light' : 'text-slate-600 group-hover:text-slate-400',
            )}
          />
        </span>
      </button>

      {/* Tasks */}
      {expanded && (
        <div
          id={panelId}
          role="region"
          aria-label={`${dayData.day} görevleri`}
          className="flex flex-col border-t border-white/[0.05] px-3 pb-3 sm:px-4 sm:pb-4"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1.5 mt-2.5">
              {visibleTasks.length === 0 && (
                <EmptyState
                  icon={totalCount === 0 ? '📋' : '🔍'}
                  title={totalCount === 0 ? 'Henüz görev yok.' : 'Sonuç bulunamadı.'}
                  description={totalCount === 0 ? 'Aşağıdan yeni görev ekleyin.' : undefined}
                />
              )}
              {visibleTasks.map((task, i) => (
                <div key={task.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-stagger-fade">
                  <TaskRow
                    task={task}
                    dragEnabled={dragEnabled}
                    onToggleStatus={() => onToggleTaskStatus(task.id)}
                    onEditTask={() => onEditTask(task.id)}
                    onQuickAttachFiles={(files) => onQuickAttachFiles(task.id, files)}
                    onPreviewAttachment={onPreviewAttachment}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
          <DayAppendDropZone dayIndex={dayIndex} disabled={!dragEnabled} />

          {/* Add task */}
          <button
            type="button"
            onClick={onAddTask}
            className="group mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.08] px-3 py-3 text-[12px] font-semibold text-neutral-400 transition-all hover:border-accent/30 hover:bg-accent/[0.04] hover:text-accent-light sm:w-fit sm:justify-start sm:py-2"
          >
            <Plus className="size-3.5 text-accent group-hover:rotate-90 transition-transform duration-200" />
            Görev Ekle
          </button>
        </div>
      )}
    </Card>
  );
}
