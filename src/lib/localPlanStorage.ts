/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PlanSnapshot } from '../types/plan';
import { defaultSnapshot, parseImportedJson } from './planSnapshot';

export const LOCAL_PLAN_STORAGE_KEY = 'weekly-plan-snapshot-v1';

export function readLocalPlan(): PlanSnapshot | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_PLAN_STORAGE_KEY);
    if (!raw) return null;
    const r = parseImportedJson(raw);
    if (!r.ok) return null;
    return r.snapshot;
  } catch {
    return null;
  }
}

export function writeLocalPlan(snapshot: PlanSnapshot): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PLAN_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota or private mode */
  }
}

export function initialPlanFromStorage(): PlanSnapshot {
  return readLocalPlan() ?? defaultSnapshot();
}
