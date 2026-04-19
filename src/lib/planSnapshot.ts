/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { STATUSES, PRIORITIES, PLAN_EXPORT_VERSION, type DayTasks, type PlanSnapshot, type Priority, type Status, type Task } from '../types/plan';
import { DEFAULT_WEEK_START_ISO, emptyReminders, INITIAL_DATA, TEAM } from '../data/constants';

function isStatus(v: unknown): v is Status {
  return typeof v === 'string' && STATUSES.includes(v as Status);
}

function isPriority(v: unknown): v is Priority {
  return typeof v === 'string' && PRIORITIES.includes(v as Priority);
}

function normalizeAssignees(raw: unknown): Task['assignees'] {
  if (!Array.isArray(raw) || raw.length === 0) return [...TEAM];
  const out: Task['assignees'] = [];
  for (const a of raw) {
    if (a && typeof a === 'object' && 'id' in a && typeof (a as { id: unknown }).id === 'string') {
      const m = TEAM.find((t) => t.id === (a as AssigneeLike).id);
      if (m) out.push(m);
    }
  }
  return out.length ? out : [...TEAM];
}

interface AssigneeLike {
  id: string;
}

function normalizeAttachments(raw: unknown): Task['attachments'] {
  if (!Array.isArray(raw)) return [];
  const out: Task['attachments'] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    if (
      typeof o.id === 'string' &&
      typeof o.name === 'string' &&
      typeof o.mimeType === 'string' &&
      typeof o.size === 'number' &&
      typeof o.bucket === 'string' &&
      typeof o.key === 'string' &&
      typeof o.url === 'string'
    ) {
      out.push({
        id: o.id,
        name: o.name,
        mimeType: o.mimeType,
        size: o.size,
        bucket: o.bucket,
        key: o.key,
        url: o.url,
        dataUrl: typeof o.dataUrl === 'string' ? o.dataUrl : undefined,
      });
      continue;
    }
    // Legacy local attachment payload (before storage bucket integration)
    if (
      typeof o.id === 'string' &&
      typeof o.name === 'string' &&
      typeof o.mimeType === 'string' &&
      typeof o.size === 'number' &&
      typeof o.dataUrl === 'string'
    ) {
      out.push({
        id: o.id,
        name: o.name,
        mimeType: o.mimeType,
        size: o.size,
        bucket: 'legacy-local',
        key: o.id,
        url: o.dataUrl,
        dataUrl: o.dataUrl,
      });
    }
  }
  return out;
}

function parseTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.title !== 'string') return null;
  if (!isStatus(o.status) || !isPriority(o.priority)) return null;
  return {
    id: o.id,
    title: o.title,
    status: o.status,
    priority: o.priority,
    assignees: normalizeAssignees(o.assignees),
    notes: typeof o.notes === 'string' ? o.notes : '',
    attachments: normalizeAttachments(o.attachments),
  };
}

function parseDay(raw: unknown): DayTasks | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.day !== 'string' || !Array.isArray(o.tasks)) return null;
  const tasks = o.tasks.map(parseTask).filter((t): t is Task => t !== null);
  return { day: o.day, tasks };
}

export function defaultSnapshot(): PlanSnapshot {
  return {
    version: PLAN_EXPORT_VERSION,
    weekStart: DEFAULT_WEEK_START_ISO,
    preparer: '',
    days: structuredClone(INITIAL_DATA),
    reminders: emptyReminders(),
  };
}

export function parseImportedJson(text: string): { ok: true; snapshot: PlanSnapshot } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Geçersiz JSON dosyası.' };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Dosya boş veya geçersiz.' };
  }
  const o = parsed as Record<string, unknown>;

  const version = typeof o.version === 'number' ? o.version : 0;
  if (version > PLAN_EXPORT_VERSION) {
    return { ok: false, error: `Bu uygulama dosya sürümünü (${version}) desteklemiyor.` };
  }

  let weekStart = typeof o.weekStart === 'string' ? o.weekStart : DEFAULT_WEEK_START_ISO;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(weekStart)) {
    const [d, m, y] = weekStart.split('/').map(Number);
    weekStart = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const preparer =
    o.preparer === null || o.preparer === undefined
      ? ''
      : typeof o.preparer === 'string'
        ? o.preparer
        : '';

  let days: DayTasks[];
  if (Array.isArray(o.days)) {
    const parsedDays = o.days.map(parseDay).filter((d): d is DayTasks => d !== null);
    days = parsedDays.length ? parsedDays : structuredClone(INITIAL_DATA);
  } else {
    days = structuredClone(INITIAL_DATA);
  }

  let reminders: string[];
  if (Array.isArray(o.reminders) && o.reminders.every((x) => typeof x === 'string')) {
    reminders = [...o.reminders];
    while (reminders.length < emptyReminders().length) reminders.push('');
    reminders = reminders.slice(0, emptyReminders().length);
  } else {
    reminders = emptyReminders();
  }

  return {
    ok: true,
    snapshot: {
      version: PLAN_EXPORT_VERSION,
      weekStart,
      preparer,
      days,
      reminders,
    },
  };
}

export function buildExportPayload(
  snapshot: PlanSnapshot,
  extras: { exportedAt: string; filterApplied: string }
): Record<string, unknown> {
  return {
    version: snapshot.version,
    exportedAt: extras.exportedAt,
    weekStart: snapshot.weekStart,
    preparer: snapshot.preparer || null,
    filterApplied: extras.filterApplied,
    days: snapshot.days,
    reminders: snapshot.reminders,
  };
}

export function newTaskId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `t-${crypto.randomUUID()}`;
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
