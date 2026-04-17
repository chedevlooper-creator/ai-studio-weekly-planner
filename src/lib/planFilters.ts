/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Task } from '../types/plan';

export function taskMatchesFilter(task: Task, filter: string): boolean {
  if (filter === 'Tümü') return true;
  if (filter === 'Bekliyor' || filter === 'Devam Eden' || filter === 'Tamamlanan') {
    return task.status === filter;
  }
  if (filter === 'Yüksek' || filter === 'Orta') {
    return task.priority === filter;
  }
  return true;
}

export function taskMatchesSearch(task: Task, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    task.title.toLowerCase().includes(s) ||
    (task.notes && task.notes.toLowerCase().includes(s)) ||
    task.assignees.some((a) => a.name.toLowerCase().includes(s)) ||
    task.attachments.some((a) => a.name.toLowerCase().includes(s))
  );
}

export function taskVisible(task: Task, filter: string, search: string): boolean {
  return taskMatchesFilter(task, filter) && taskMatchesSearch(task, search);
}
