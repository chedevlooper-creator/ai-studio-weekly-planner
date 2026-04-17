/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Status = 'Bekliyor' | 'Devam Eden' | 'Tamamlanan';
export type Priority = 'Yüksek' | 'Orta';

export interface Assignee {
  id: string;
  name: string;
  color: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  bucket: string;
  key: string;
  url: string;
  // Legacy local attachments fallback.
  dataUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  assignees: Assignee[];
  status: Status;
  notes: string;
  attachments: TaskAttachment[];
}

export interface DayTasks {
  day: string;
  tasks: Task[];
}

export const PLAN_EXPORT_VERSION = 1;

export interface PlanSnapshot {
  version: number;
  weekStart: string;
  preparer: string;
  days: DayTasks[];
  reminders: string[];
}
