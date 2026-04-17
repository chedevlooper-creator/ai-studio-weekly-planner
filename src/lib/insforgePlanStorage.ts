import type { PlanSnapshot } from '../types/plan';
import { getInsforgeClient } from './insforgeClient';
import { parseImportedJson } from './planSnapshot';

const TABLE_NAME = 'weekly_plans';

export async function readRemotePlan(userId: string): Promise<PlanSnapshot | null> {
  const client = getInsforgeClient();
  if (!client) return null;

  const byUserId = await client.database.from(TABLE_NAME).select('payload').eq('user_id', userId).maybeSingle();
  let payload: unknown = null;
  if (!byUserId.error && byUserId.data && typeof byUserId.data === 'object' && 'payload' in byUserId.data) {
    payload = (byUserId.data as { payload?: unknown }).payload;
  }
  if (!payload) {
    // Backward compatibility for old schema that keyed rows by id.
    const byLegacyId = await client.database.from(TABLE_NAME).select('payload').eq('id', userId).maybeSingle();
    if (!byLegacyId.error && byLegacyId.data && typeof byLegacyId.data === 'object' && 'payload' in byLegacyId.data) {
      payload = (byLegacyId.data as { payload?: unknown }).payload;
    }
  }
  if (!payload) return null;

  const parsed = parseImportedJson(JSON.stringify(payload));
  return parsed.ok ? parsed.snapshot : null;
}

export async function writeRemotePlan(userId: string, snapshot: PlanSnapshot): Promise<boolean> {
  const client = getInsforgeClient();
  if (!client) return false;

  const row = { id: userId, user_id: userId, payload: snapshot, updated_at: new Date().toISOString() };

  // Try user_id conflict first, fallback to id-based conflict
  const write = await client.database.from(TABLE_NAME).upsert([row], { onConflict: 'user_id' });
  if (!write.error) return true;

  const fallback = await client.database.from(TABLE_NAME).upsert([row], { onConflict: 'id' });
  if (!fallback.error) return true;

  console.warn('InsForge remote save failed:', fallback.error);
  return false;
}
