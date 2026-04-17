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

export const DEFAULT_WEEK_START_ISO = '2026-04-16';

export const INITIAL_DATA: DayTasks[] = [
  {
    day: 'Pazartesi',
    tasks: [
      { id: 't1', title: 'Kafkasder fitre dağıtımı', priority: 'Yüksek', assignees: [TEAM[0], TEAM[1], TEAM[2]], status: 'Bekliyor', notes: '', attachments: [] },
      { id: 't2', title: 'Kafkas Vakfı fitre dağıtımı', priority: 'Yüksek', assignees: [TEAM[0], TEAM[1], TEAM[2]], status: 'Bekliyor', notes: '', attachments: [] },
      { id: 't3', title: 'Yanlış yazılan isimlerin düzeltilmesi', priority: 'Yüksek', assignees: [TEAM[0], TEAM[1], TEAM[2]], status: 'Bekliyor', notes: '', attachments: [] },
    ],
  },
  {
    day: 'Salı',
    tasks: [
      { id: 't4', title: 'Bayramlık hazırlıkları', priority: 'Yüksek', assignees: [TEAM[0], TEAM[1], TEAM[2]], status: 'Bekliyor', notes: '', attachments: [] },
      { id: 't5', title: '2024-2025 arşivleme', priority: 'Yüksek', assignees: [TEAM[0], TEAM[1], TEAM[2]], status: 'Bekliyor', notes: '', attachments: [] },
      { id: 't6', title: '2025-2026 arşivleme', priority: 'Yüksek', assignees: [TEAM[0], TEAM[1], TEAM[2]], status: 'Bekliyor', notes: '', attachments: [] },
    ],
  },
  {
    day: 'Çarşamba',
    tasks: [
      { id: 't7', title: 'Yetimler Vakfı bayramlık dağıtım listesini hazırlamak', priority: 'Yüksek', assignees: [TEAM[0], TEAM[1], TEAM[2]], status: 'Bekliyor', notes: '', attachments: [] },
    ],
  },
];

export const REMINDER_SLOT_COUNT = 5;

export function emptyReminders(): string[] {
  return Array.from({ length: REMINDER_SLOT_COUNT }, () => '');
}
