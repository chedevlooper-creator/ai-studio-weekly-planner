/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Assignee, DayTasks } from '../types/plan';

export const TEAM: Assignee[] = [
  { id: '1', name: 'Liman', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
  { id: '2', name: 'İman', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  { id: '3', name: 'İsa', color: 'bg-pink-500/20 text-pink-400 border-pink-500/50' },
];

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0]!;
}

export const DEFAULT_WEEK_START_ISO = getCurrentWeekStart();

const t0 = TEAM[0]!;
const t1 = TEAM[1]!;
const t2 = TEAM[2]!;

export const INITIAL_DATA: DayTasks[] = [
  {
    day: 'Pazartesi',
    tasks: [
      { id: 't1', title: 'Kafkasder fitre dağıtımı', priority: 'Yüksek', assignees: [t0, t1, t2], status: 'Bekliyor', notes: '', attachments: [] },
      { id: 't2', title: 'Kafkas Vakfı fitre dağıtımı', priority: 'Yüksek', assignees: [t0, t1, t2], status: 'Bekliyor', notes: '', attachments: [] },
      { id: 't3', title: 'Yanlış yazılan isimlerin düzeltilmesi', priority: 'Yüksek', assignees: [t0, t1, t2], status: 'Bekliyor', notes: '', attachments: [] },
    ],
  },
  {
    day: 'Salı',
    tasks: [
      { id: 't4', title: 'Bayramlık hazırlıkları', priority: 'Yüksek', assignees: [t0, t1, t2], status: 'Bekliyor', notes: '', attachments: [] },
      { id: 't5', title: '2024-2025 arşivleme', priority: 'Yüksek', assignees: [t0, t1, t2], status: 'Bekliyor', notes: '', attachments: [] },
      { id: 't6', title: '2025-2026 arşivleme', priority: 'Yüksek', assignees: [t0, t1, t2], status: 'Bekliyor', notes: '', attachments: [] },
    ],
  },
  {
    day: 'Çarşamba',
    tasks: [
      { id: 't7', title: 'Yetimler Vakfı bayramlık dağıtım listesini hazırlamak', priority: 'Yüksek', assignees: [t0, t1, t2], status: 'Bekliyor', notes: '', attachments: [] },
    ],
  },
];

const REMINDER_SLOT_COUNT = 5;

export function emptyReminders(): string[] {
  return Array.from({ length: REMINDER_SLOT_COUNT }, () => '');
}

/** Maximum number of characters to show for text file previews */
export const TEXT_PREVIEW_CHARS = 4000;

/** Toast auto-dismiss duration in milliseconds */
export const TOAST_AUTO_DISMISS_MS = 4000;

/** Max file upload size (5MB) */
export const MAX_TASK_FILE_SIZE = 5 * 1024 * 1024;

/** Max image size for data URL embedding in AI chat (2MB) */
export const MAX_IMAGE_DATAURL_SIZE = 2 * 1024 * 1024;
