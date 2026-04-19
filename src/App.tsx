/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fragment, useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { AuthGate } from './components/auth/AuthGate';
import { AppHeader } from './components/header/AppHeader';
import { FilterBar } from './components/planner/FilterBar';
import { DaySection } from './components/planner/DaySection';
import { TaskEditModal } from './components/planner/TaskEditModal';
import { FilePreviewModal } from './components/planner/FilePreviewModal';
import { AIAssistant } from './components/planner/AIAssistant';
import { FloatingActionButton } from './components/planner/FloatingActionButton';
import { MobileBottomNav, type MobileTab } from './components/planner/MobileBottomNav';
import { TeamPanel } from './components/planner/TeamPanel';
import { RemindersPanel } from './components/planner/RemindersPanel';
import { useWeeklyPlan } from './hooks/useWeeklyPlan';
import { useToast } from './components/ui/Toast';
import { findDayIndexByTaskId } from './lib/planDnd';
import type { TaskAttachment } from './types/plan';

export default function App() {
  const [guestMode, setGuestMode] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);

  const guestId = useMemo(() => {
    if (typeof localStorage === 'undefined') return null;
    const key = 'guest-plan-user-id-v1';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = `guest-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`;
    localStorage.setItem(key, created);
    return created;
  }, []);

  return (
    <AuthGate guestMode={guestMode} guestId={guestId} onGuestMode={() => setGuestMode(true)}>
      {({ user, auth, activeUserId }) => (
        <MainApp
          user={user} auth={auth} activeUserId={activeUserId} guestMode={guestMode}
          previewAttachment={previewAttachment} setPreviewAttachment={setPreviewAttachment}
        />
      )}
    </AuthGate>
  );
}

function MainApp({
  user, auth, activeUserId, guestMode, previewAttachment, setPreviewAttachment,
}: {
  user: { id?: string; email?: string } | null;
  auth: { user: any; signOut: () => Promise<void> };
  activeUserId: string | null;
  guestMode: boolean;
  previewAttachment: TaskAttachment | null;
  setPreviewAttachment: (a: TaskAttachment | null) => void;
}) {
  const plan = useWeeklyPlan(activeUserId);
  const toast = useToast();
  const [mobileTab, setMobileTab] = useState<MobileTab>('hafta');
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const {
    data, filter, searchQuery, fileInputRef, stats, assigneeStats, syncStatus,
    expandedDays, toggleDay, setFilter, setSearchQuery, searchInputRef,
    reminders, setReminderAt, editingNote, setEditingNote,
    taskModal, closeTaskModal, openAddTask, openEditTask,
    toggleTaskStatus, updateTaskNotes, deleteTask, addTaskWithFields,
    moveOrReorderTask, updateTaskFull, exportJson, importFromFile, quickAttachFiles,
  } = plan;

  const dragEnabled = filter === 'Tümü' && !searchQuery.trim();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!dragEnabled) return;
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;
    if (overId.startsWith('day-append-')) {
      const n = Number(overId.replace('day-append-', ''));
      if (!Number.isNaN(n) && n >= 0 && n < data.length) moveOrReorderTask(activeId, n, null);
    } else {
      const d = findDayIndexByTaskId(data, overId);
      if (d >= 0) moveOrReorderTask(activeId, d, overId);
    }
  }, [data, dragEnabled, moveOrReorderTask]);

  const modalTask = taskModal?.mode === 'edit'
    ? data[taskModal.dayIndex]?.tasks.find((t) => t.id === taskModal.taskId) ?? null
    : null;

  const handleExport = useCallback(() => { exportJson(); toast.success('Plan dışa aktarıldı.'); }, [exportJson, toast]);
  const handleImport = useCallback((file: File) => {
    void importFromFile(file).then((r) => {
      if (r.ok) toast.success('Plan içe aktarıldı.');
      else toast.error(r.error);
    });
  }, [importFromFile, toast]);

  const showWeekly = mobileTab === 'hafta';
  const showTeam = mobileTab === 'takim';
  const showNotes = mobileTab === 'notlar';

  const handleMobileTabChange = useCallback((tab: MobileTab) => {
    if (tab === 'ai') {
      setIsAiAssistantOpen(true);
      return;
    }
    setIsAiAssistantOpen(false);
    setMobileTab(tab);
  }, []);

  return (
    <div className="min-h-screen font-sans text-slate-100">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[500] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-white">
        Ana içeriğe geç
      </a>

      <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" aria-hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ''; }} />

      <main id="main-content" className="mx-auto flex w-full max-w-[min(96vw,1440px)] flex-col gap-4 px-2 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] sm:gap-5 sm:px-4 sm:py-5 sm:pb-5 lg:px-6">

        <AppHeader
          user={user} stats={stats} assigneeStats={assigneeStats} syncStatus={syncStatus}
          activeUserId={activeUserId} onExport={handleExport}
          onImport={() => fileInputRef.current?.click()}
          onSignOut={() => void auth.signOut()} fileInputRef={fileInputRef}
        />

        {!user && guestMode && (
          <section className="flex items-center gap-2.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] px-4 py-2.5 text-xs text-amber-300/80">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            Verilerinizi buluta kaydetmek için bir hesap oluşturun.
          </section>
        )}

        {/* ── HAFTA ── */}
        <div className={showWeekly ? '' : 'hidden sm:block'}>
          <div className="flex flex-col gap-3 sm:gap-5">
            <FilterBar filter={filter} setFilter={setFilter} searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchInputRef={searchInputRef} />

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}
              autoScroll={{ acceleration: 14, threshold: { x: 0.12, y: 0.12 } }}>
              <div id="planner-grid" className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {data.map((dayData, dayIndex) => (
                  <Fragment key={dayData.day}>
                    <DaySection
                      dayData={dayData} dayIndex={dayIndex}
                      expanded={expandedDays.includes(dayData.day)}
                      onToggleExpand={() => toggleDay(dayData.day)}
                      filter={filter} searchQuery={searchQuery} dragEnabled={dragEnabled}
                      editingNote={editingNote}
                      onToggleTaskStatus={(taskId) => toggleTaskStatus(dayIndex, taskId)}
                      onUpdateTaskNotes={(taskId, notes) => updateTaskNotes(dayIndex, taskId, notes)}
                      onEditingNoteClose={() => setEditingNote(null)}
                      onStartEditNote={(taskId) => setEditingNote({ dayIndex, taskId })}
                      onAddTask={() => openAddTask(dayIndex)}
                      onEditTask={(taskId) => openEditTask(dayIndex, taskId)}
                      onDeleteTask={(taskId) => deleteTask(dayIndex, taskId)}
                      onQuickAttachFiles={(taskId, files) => quickAttachFiles(dayIndex, taskId, files)}
                      onPreviewAttachment={setPreviewAttachment}
                    />
                  </Fragment>
                ))}
              </div>
            </DndContext>
          </div>
        </div>

        {/* ── TAKIM ── */}
        <div className={showTeam ? 'sm:hidden' : 'hidden'}>
          <TeamPanel assigneeStats={assigneeStats} />
        </div>

        {/* ── NOTLAR ── */}
        <div className={showNotes ? 'sm:hidden' : 'hidden'}>
          <RemindersPanel reminders={reminders} onChange={setReminderAt} />
        </div>

        {/* Desktop bottom panels */}
        <div className="no-print hidden sm:flex flex-col gap-5">
          <div className="lg:hidden"><TeamPanel assigneeStats={assigneeStats} /></div>
          <RemindersPanel reminders={reminders} onChange={setReminderAt} />
        </div>

      </main>

      {/* Modals */}
      <TaskEditModal modal={taskModal} days={data} task={modalTask} onClose={closeTaskModal}
        onAdd={addTaskWithFields} onUpdate={updateTaskFull} onDelete={deleteTask} ownerId={activeUserId} />
      <FilePreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
      <AIAssistant planActions={plan} open={isAiAssistantOpen} onOpenChange={setIsAiAssistantOpen} />

      {/* Mobile */}
      <MobileBottomNav activeTab={mobileTab} aiOpen={isAiAssistantOpen} onAiOpen={() => setIsAiAssistantOpen(true)} onTabChange={handleMobileTabChange} />
      {mobileTab === 'hafta' && <FloatingActionButton onAddTask={() => openAddTask(0)} />}
    </div>
  );
}
