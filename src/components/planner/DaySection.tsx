/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, Plus } from 'lucide-react';
import type { DayTasks, TaskAttachment } from '../../types/plan';

const WEEKEND_DAYS = ['Cumartesi', 'Pazar'];

const DAY_ICONS: Record<string, string> = {
  'Pazartesi': '🟣',
  'Salı': '🔵',
  'Çarşamba': '🟢',
  'Perşembe': '🟡',
  'Cuma': '🟠',
  'Cumartesi': '🔴',
  'Pazar': '⚪',
};

function dayAccentClass(day: string): string {
  if (WEEKEND_DAYS.includes(day)) return 'from-violet-500/80 to-purple-600/80';
  const map: Record<string, string> = {
    'Pazartesi': 'from-indigo-500/80 to-blue-600/80',
    'Salı': 'from-blue-500/80 to-cyan-600/80',
    'Çarşamba': 'from-emerald-500/80 to-teal-600/80',
    'Perşembe': 'from-amber-500/80 to-orange-600/80',
    'Cuma': 'from-orange-500/80 to-red-600/80',
  };
  return map[day] ?? 'from-accent/80 to-accent-light/80';
}

import { taskVisible } from '../../lib/planFilters';
import { cn } from '../../lib/utils';
import { LuxuryCard } from './LuxuryCard';
import { TaskRow } from './TaskRow';

function DayAppendDropZone({ dayIndex, disabled }: { dayIndex: number; disabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-append-${dayIndex}`,
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'no-print -mx-1 min-h-6 rounded-lg border border-dashed px-1 transition-all duration-200',
        disabled ? 'pointer-events-none border-transparent' : 'border-white/[0.06]',
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
  editingNote,
  onToggleTaskStatus,
  onUpdateTaskNotes,
  onEditingNoteClose,
  onStartEditNote,
  onAddTask,
  onEditTask,
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
  onQuickAttachFiles: (taskId: string, files: FileList | File[]) => Promise<void>;
  onPreviewAttachment: (attachment: TaskAttachment) => void;
}) {
  const visibleTasks = dayData.tasks.filter((t) => taskVisible(t, filter, searchQuery));
  const sortableIds = dayData.tasks.map((t) => t.id);
  const completedCount = dayData.tasks.filter(t => t.status === 'Tamamlanan').length;
  const totalCount = dayData.tasks.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <LuxuryCard
      className={cn(
        'overflow-hidden flex flex-col',
        expanded && 'ring-1 ring-accent/15',
      )}
    >
      {/* Day header */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="group relative flex w-full cursor-pointer items-center justify-between px-3 py-3 sm:px-5 sm:py-4 text-left transition-colors hover:bg-white/[0.02]"
        aria-expanded={expanded}
        aria-controls={`day-panel-${dayIndex}`}
      >
        <span className="flex items-center gap-3">
          {/* Day color bar */}
          <span
            className={cn(
              'h-8 w-1 rounded-full bg-gradient-to-b transition-all duration-300',
              dayAccentClass(dayData.day),
              !expanded && 'opacity-40 group-hover:opacity-70'
            )}
            aria-hidden
          />
          <div className="flex flex-col">
            <span className="flex items-center gap-2">
              <span className="text-sm" aria-hidden>{DAY_ICONS[dayData.day] ?? '📅'}</span>
              <span className="font-display text-[15px] font-bold tracking-tight text-white sm:text-lg">
                {dayData.day}
              </span>
            </span>
            {WEEKEND_DAYS.includes(dayData.day) && (
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-violet-400/50 leading-none mt-0.5 ml-6">
                Hafta Sonu
              </span>
            )}
          </div>
        </span>

        <span className="flex items-center gap-2 sm:gap-3">
          {/* Mini progress bar */}
          {totalCount > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400 transition-all duration-700"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold tabular-nums text-neutral-500">
                {completedCount}/{totalCount}
              </span>
            </div>
          )}
          {/* Task count badge */}
          <span className={cn(
            'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold tabular-nums',
            expanded ? 'bg-accent/10 text-accent-light border border-accent/20' : 'bg-white/[0.04] text-neutral-500 border border-white/[0.06]'
          )}>
            {visibleTasks.length}
            {visibleTasks.length !== totalCount && <span className="text-neutral-600">/{totalCount}</span>}
            <span className="hidden sm:inline ml-0.5 font-medium">Görev</span>
          </span>
          {/* Chevron */}
          <ChevronDown
            className={cn(
              'size-4 transition-all duration-300',
              expanded ? 'rotate-180 text-accent-light' : 'text-neutral-600 group-hover:text-neutral-400'
            )}
            aria-hidden
          />
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          id={`day-panel-${dayIndex}`}
          className="flex flex-col border-t border-white/[0.04] px-2.5 pb-3 sm:px-5 sm:pb-5"
          role="region"
          style={{ animation: 'fadeIn 0.25s ease-out' }}
        >

          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1.5 mt-3">
              {visibleTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-10 text-center">
                  <div className="text-2xl mb-2">📋</div>
                  <p className="text-sm font-medium text-neutral-500">
                    {totalCount === 0
                      ? 'Bu güne henüz görev planlanmadı.'
                      : 'Aradığınız kriterlere uygun görev bulunamadı.'}
                  </p>
                </div>
              )}
              {visibleTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  dragEnabled={dragEnabled}
                  editingNote={editingNote?.dayIndex === dayIndex && editingNote?.taskId === task.id}
                  onToggleStatus={() => onToggleTaskStatus(task.id)}
                  onNoteChange={(notes) => onUpdateTaskNotes(task.id, notes)}
                  onNoteEditorClose={onEditingNoteClose}
                  onStartEditNote={() => onStartEditNote(task.id)}
                  onEditTask={() => onEditTask(task.id)}
                  onQuickAttachFiles={(files) => onQuickAttachFiles(task.id, files)}
                  onPreviewAttachment={onPreviewAttachment}
                />
              ))}
            </div>
          </SortableContext>
          <DayAppendDropZone dayIndex={dayIndex} disabled={!dragEnabled} />

          {/* Add task button */}
          <button
            type="button"
            onClick={onAddTask}
            className="group mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/[0.08] bg-transparent px-3.5 py-2 text-[12px] sm:text-[13px] font-semibold text-neutral-400 transition-all hover:border-accent/30 hover:bg-accent/[0.04] hover:text-accent-light"
          >
            <Plus className="size-3.5 text-accent transition-transform duration-200 group-hover:rotate-90" aria-hidden />
            Görev Ekle
          </button>
        </div>
      )}
    </LuxuryCard>
  );
}
