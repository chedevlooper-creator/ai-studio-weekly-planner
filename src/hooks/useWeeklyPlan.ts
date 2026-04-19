/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TEAM } from '../data/constants';
import { initialPlanFromStorage, writeLocalPlan } from '../lib/localPlanStorage';
import { readRemotePlan, writeRemotePlan } from '../lib/insforgePlanStorage';
import { getInsforgeClient } from '../lib/insforgeClient';
import { subscribePlanChannel, type PlanRealtimeHandle } from '../lib/insforgeRealtime';
import { MAX_TASK_FILE_SIZE, TASK_FILES_BUCKET, uploadTaskFile } from '../lib/insforgeStorage';
import { buildExportPayload, newTaskId, parseImportedJson } from '../lib/planSnapshot';
import type { Assignee, DayTasks, PlanSnapshot, Priority, Status, Task, TaskAttachment } from '../types/plan';
import type { AiTaskDraft } from '../lib/aiTaskDrafts';
import { PLAN_EXPORT_VERSION } from '../types/plan';

export type TaskModalState =
  | { mode: 'add'; dayIndex: number }
  | { mode: 'edit'; dayIndex: number; taskId: string }
  | null;

export const FILTER_OPTIONS = ['Tümü', 'Bekliyor', 'Devam Eden', 'Tamamlanan', 'Yüksek', 'Orta'] as const;

function formatWeekLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function deriveStats(days: DayTasks[]) {
  let totalTasks = 0;
  let highPriority = 0;
  let inProgress = 0;
  let completed = 0;
  let waiting = 0;
  days.forEach((d) => {
    d.tasks.forEach((t) => {
      totalTasks++;
      if (t.priority === 'Yüksek') highPriority++;
      if (t.status === 'Devam Eden') inProgress++;
      if (t.status === 'Tamamlanan') completed++;
      if (t.status === 'Bekliyor') waiting++;
    });
  });
  const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  return { totalTasks, highPriority, inProgress, completed, waiting, completionRate };
}

function assigneeStatsFrom(days: DayTasks[]) {
  return TEAM.map((member) => {
    let assigned = 0;
    let done = 0;
    days.forEach((d) => {
      d.tasks.forEach((t) => {
        if (t.assignees.some((a) => a.id === member.id)) {
          assigned++;
          if (t.status === 'Tamamlanan') done++;
        }
      });
    });
    return { member, assigned, done };
  });
}

function resolveAssignees(names: string[] | undefined): Assignee[] {
  if (!names?.length) return [...TEAM];
  const out: Assignee[] = [];
  for (const n of names) {
    const trimmed = n.trim();
    const m = TEAM.find((t) => t.name.localeCompare(trimmed, 'tr', { sensitivity: 'base' }) === 0);
    if (m) out.push(m);
  }
  return out.length ? out : [...TEAM];
}

export function useWeeklyPlan(userId: string | null) {
  const init = useMemo(() => initialPlanFromStorage(), []);
  const [data, setData] = useState<DayTasks[]>(init.days);
  const [expandedDays, setExpandedDays] = useState<string[]>(() => init.days.map((d) => d.day));
  const [filter, setFilter] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [preparerName, setPreparerName] = useState(init.preparer);
  const [weekStart, setWeekStart] = useState(init.weekStart);
  const [reminders, setReminders] = useState<string[]>(init.reminders);
  const [editingNote, setEditingNote] = useState<{ dayIndex: number; taskId: string } | null>(null);
  const [taskModal, setTaskModal] = useState<TaskModalState>(null);
  const [remoteBootstrapped, setRemoteBootstrapped] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'local-only'>('idle');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const realtimeRef = useRef<PlanRealtimeHandle | null>(null);
  const skipNextRemoteSaveRef = useRef(false);

  const snapshot = useMemo<PlanSnapshot>(
    () => ({
      version: PLAN_EXPORT_VERSION,
      weekStart,
      preparer: preparerName,
      days: data,
      reminders,
    }),
    [data, preparerName, weekStart, reminders]
  );

  const stats = useMemo(() => deriveStats(data), [data]);
  const assigneeStats = useMemo(() => assigneeStatsFrom(data), [data]);

  useEffect(() => {
    if (!userId) {
      setRemoteBootstrapped(true);
      return;
    }
    setRemoteBootstrapped(false);
    let cancelled = false;
    readRemotePlan(userId)
      .then((remote) => {
        if (!remote || cancelled) return;
        setData(remote.days);
        setPreparerName(remote.preparer);
        setWeekStart(remote.weekStart);
        setReminders(remote.reminders);
        setExpandedDays(remote.days.map((d) => d.day));
      })
      .finally(() => {
        if (!cancelled) setRemoteBootstrapped(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const t = window.setTimeout(() => writeLocalPlan(snapshot), 400);
    return () => window.clearTimeout(t);
  }, [snapshot]);

  useEffect(() => {
    if (!remoteBootstrapped || !userId) return;
    if (!getInsforgeClient()) {
      setSyncStatus('local-only');
      return;
    }
    if (skipNextRemoteSaveRef.current) {
      skipNextRemoteSaveRef.current = false;
      return;
    }
    setSyncStatus('saving');
    const t = window.setTimeout(() => {
      writeRemotePlan(userId, snapshot).then((ok) => {
        setSyncStatus(ok ? 'saved' : 'error');
        if (ok) {
          realtimeRef.current?.publish(snapshot);
          // Reset to idle after 2s to avoid permanent "saved" badge
          const reset = window.setTimeout(() => setSyncStatus('idle'), 2000);
          return () => window.clearTimeout(reset);
        }
      });
    }, 700);
    return () => window.clearTimeout(t);
  }, [remoteBootstrapped, snapshot, userId]);

  useEffect(() => {
    if (!userId) return;
    const handle = subscribePlanChannel(userId, (remoteSnapshot) => {
      // Apply remote update without triggering another remote save (avoid echo loop).
      skipNextRemoteSaveRef.current = true;
      setData(remoteSnapshot.days);
      setPreparerName(remoteSnapshot.preparer);
      setWeekStart(remoteSnapshot.weekStart);
      setReminders(remoteSnapshot.reminders);
    });
    realtimeRef.current = handle;
    return () => {
      handle.unsubscribe();
      if (realtimeRef.current === handle) realtimeRef.current = null;
    };
  }, [userId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (taskModal) return;
      const t = e.target as Node;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [taskModal]);

  const toggleDay = useCallback((day: string) => {
    setExpandedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }, []);

  const toggleTaskStatus = useCallback((dayIndex: number, taskId: string) => {
    setData((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? {
              ...d,
              tasks: d.tasks.map((t) => {
                if (t.id !== taskId) return t;
                let status: Status = t.status;
                if (t.status === 'Bekliyor') status = 'Devam Eden';
                else if (t.status === 'Devam Eden') status = 'Tamamlanan';
                else status = 'Bekliyor';
                return { ...t, status };
              }),
            }
          : d
      )
    );
  }, []);

  const updateTaskNotes = useCallback((dayIndex: number, taskId: string, notes: string) => {
    setData((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, notes } : t)) } : d
      )
    );
  }, []);

  const deleteTask = useCallback((dayIndex: number, taskId: string) => {
    setData((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, tasks: d.tasks.filter((t) => t.id !== taskId) } : d))
    );
    setTaskModal(null);
  }, []);

  const addTaskWithFields = useCallback((dayIndex: number, fields: Omit<Task, 'id'>) => {
    const id = newTaskId();
    setData((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, tasks: [...d.tasks, { ...fields, id }] } : d
      )
    );
    setTaskModal(null);
  }, []);

  const moveOrReorderTask = useCallback((taskId: string, toDayIndex: number, insertBeforeTaskId: string | null) => {
    setData((prev) => {
      let fromDayIndex = -1;
      let task: Task | undefined;
      for (let i = 0; i < prev.length; i++) {
        const t = prev[i].tasks.find((x) => x.id === taskId);
        if (t) {
          fromDayIndex = i;
          task = t;
          break;
        }
      }
      if (!task || fromDayIndex < 0) return prev;

      const without = prev.map((d, i) =>
        i === fromDayIndex ? { ...d, tasks: d.tasks.filter((t) => t.id !== taskId) } : d
      );

      const targetList = without[toDayIndex]?.tasks;
      if (!targetList) return prev;

      let nextTasks: Task[];
      if (insertBeforeTaskId == null) {
        nextTasks = [...targetList, task];
      } else {
        const idx = targetList.findIndex((t) => t.id === insertBeforeTaskId);
        if (idx === -1) nextTasks = [...targetList, task];
        else nextTasks = [...targetList.slice(0, idx), task, ...targetList.slice(idx)];
      }

      return without.map((d, i) => (i === toDayIndex ? { ...d, tasks: nextTasks } : d));
    });
  }, []);

  const updateTaskFull = useCallback(
    (dayIndex: number, taskId: string, fields: Omit<Task, 'id'>, moveToDayIndex?: number) => {
      setData((prev) => {
        const from = prev[dayIndex].tasks.find((t) => t.id === taskId);
        if (!from) return prev;
        const next = { ...from, ...fields, id: taskId };
        if (moveToDayIndex !== undefined && moveToDayIndex !== dayIndex) {
          return prev.map((d, i) => {
            if (i === dayIndex) return { ...d, tasks: d.tasks.filter((t) => t.id !== taskId) };
            if (i === moveToDayIndex) return { ...d, tasks: [...d.tasks, next] };
            return d;
          });
        }
        return prev.map((d, i) =>
          i === dayIndex ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? next : t)) } : d
        );
      });
      setTaskModal(null);
    },
    []
  );

  const setReminderAt = useCallback((index: number, text: string) => {
    setReminders((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  }, []);

  const exportJson = useCallback(() => {
    const payload = buildExportPayload(snapshot, {
      exportedAt: new Date().toISOString(),
      filterApplied: filter,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haftalik-plan-${weekStart}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [snapshot, filter, weekStart]);

  const importFromFile = useCallback((file: File): Promise<{ ok: true } | { ok: false; error: string }> => {
    return file.text().then((text) => {
      const r = parseImportedJson(text);
      if (r.ok === false) {
        return { ok: false as const, error: r.error };
      }
      const s = r.snapshot;
      setData(s.days);
      setPreparerName(s.preparer);
      setWeekStart(s.weekStart);
      setReminders(s.reminders);
      setExpandedDays(s.days.map((d) => d.day));
      setFilter('Tümü');
      setSearchQuery('');
      return { ok: true as const };
    });
  }, []);

  const quickAttachFiles = useCallback(
    async (dayIndex: number, taskId: string, files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length || !userId) return;
      const uploaded: TaskAttachment[] = [];
      const failures: string[] = [];
      for (const file of list) {
        if (file.size > MAX_TASK_FILE_SIZE) {
          failures.push(`${file.name}: 5MB sınırını aşıyor.`);
          continue;
        }
        try {
          const result = await uploadTaskFile(userId, file);
          uploaded.push({
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            mimeType: result.mimeType,
            size: result.size,
            bucket: TASK_FILES_BUCKET,
            key: result.key,
            url: result.url,
          });
        } catch (error) {
          failures.push(`${file.name}: ${error instanceof Error ? error.message : 'Dosya yüklenemedi.'}`);
        }
      }
      if (uploaded.length) {
        setData((prev) =>
          prev.map((d, i) =>
            i === dayIndex
              ? {
                  ...d,
                  tasks: d.tasks.map((t) =>
                    t.id === taskId ? { ...t, attachments: [...(t.attachments ?? []), ...uploaded] } : t
                  ),
                }
              : d
          )
        );
      }
      if (failures.length) {
        throw new Error(failures.join('\n'));
      }
    },
    [userId]
  );

  const addTasksFromAiDrafts = useCallback((drafts: AiTaskDraft[]) => {
    if (!drafts.length) return;
    setData((prev) => {
      const next = prev.map((d) => ({ ...d, tasks: [...d.tasks] }));
      for (const draft of drafts) {
        const dayIdx = next.findIndex((x) => x.day === draft.day);
        if (dayIdx < 0) continue;
        const assignees = resolveAssignees(draft.assigneeNames);
        const task: Task = {
          id: newTaskId(),
          title: draft.title,
          priority: draft.priority === 'Orta' ? 'Orta' : 'Yüksek',
          status: draft.status ?? 'Bekliyor',
          assignees,
          notes: '',
          attachments: [],
        };
        next[dayIdx].tasks.push(task);
      }
      return next;
    });
  }, []);

  return {
    data,
    expandedDays,
    toggleDay,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    fileInputRef,
    preparerName,
    setPreparerName,
    weekStart,
    setWeekStart,
    weekLabel: formatWeekLabel(weekStart),
    reminders,
    setReminderAt,
    editingNote,
    setEditingNote,
    taskModal,
    setTaskModal,
    openAddTask: (dayIndex: number) => setTaskModal({ mode: 'add', dayIndex }),
    openEditTask: (dayIndex: number, taskId: string) => setTaskModal({ mode: 'edit', dayIndex, taskId }),
    closeTaskModal: () => setTaskModal(null),
    toggleTaskStatus,
    updateTaskNotes,
    deleteTask,
    addTaskWithFields,
    moveOrReorderTask,
    updateTaskFull,
    stats,
    assigneeStats,
    syncStatus,
    exportJson,
    importFromFile,
    quickAttachFiles,
    addTasksFromAiDrafts,
  };
}
