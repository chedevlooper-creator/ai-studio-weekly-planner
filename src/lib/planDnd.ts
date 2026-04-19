/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DayTasks } from '../types/plan';

export function findDayIndexByTaskId(days: DayTasks[], taskId: string): number {
  for (let i = 0; i < days.length; i++) {
    if (days[i]?.tasks.some((t) => t.id === taskId)) return i;
  }
  return -1;
}
