/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Normalized task shape produced by AI before merging into the weekly plan. */
export type AiTaskDraft = {
  day: string;
  title: string;
  priority?: 'Yüksek' | 'Orta';
  status?: 'Bekliyor' | 'Devam Eden' | 'Tamamlanan';
  assigneeNames?: string[];
};

export function extractJsonObject(text: string): Record<string, unknown> {
  const t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fence ? fence[1] ?? t : t).trim();
  const parsed = JSON.parse(body) as unknown;
  if (!parsed || typeof parsed !== 'object') throw new Error('Model geçerli JSON döndürmedi.');
  return parsed as Record<string, unknown>;
}

export function draftsFromAiJson(obj: Record<string, unknown>, validDayNames: string[]): AiTaskDraft[] {
  const tasksRaw = obj.tasks;
  if (!Array.isArray(tasksRaw)) throw new Error('JSON içinde "tasks" dizisi yok.');

  const drafts: AiTaskDraft[] = [];
  for (const item of tasksRaw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const day = typeof o.day === 'string' ? o.day.trim() : '';
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    if (!title) continue;

    const priority = o.priority === 'Orta' || o.priority === 'Yüksek' ? o.priority : undefined;
    const status =
      o.status === 'Bekliyor' || o.status === 'Devam Eden' || o.status === 'Tamamlanan' ? o.status : undefined;

    let assigneeNames: string[] | undefined;
    if (Array.isArray(o.assigneeNames) && o.assigneeNames.every((x) => typeof x === 'string')) {
      assigneeNames = o.assigneeNames as string[];
    }

    const normalizedDay = validDayNames.includes(day) ? day : validDayNames[0] ?? day;

    drafts.push({
      day: normalizedDay,
      title,
      priority,
      status,
      assigneeNames,
    });
  }

  return drafts;
}
