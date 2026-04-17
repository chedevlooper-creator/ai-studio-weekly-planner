/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PlanSnapshot } from '../types/plan';
import { getInsforgeClient } from './insforgeClient';

export const PLAN_UPDATED_EVENT = 'plan_updated';

export function planChannel(userId: string): string {
  return `plan:${userId}`;
}

let clientIdSingleton: string | null = null;
export function getClientId(): string {
  if (clientIdSingleton) return clientIdSingleton;
  const rand =
    (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  clientIdSingleton = `client-${rand}`;
  return clientIdSingleton;
}

export interface PlanUpdatedPayload {
  clientId: string;
  snapshot: PlanSnapshot;
  at: string;
}

export interface PlanRealtimeHandle {
  ready: Promise<boolean>;
  publish: (snapshot: PlanSnapshot) => Promise<void>;
  unsubscribe: () => void;
}

type AnyRealtime = {
  connect: () => Promise<unknown>;
  isConnected?: () => boolean;
  subscribe: (channel: string) => Promise<{ error?: unknown }>;
  unsubscribe: (channel: string) => void;
  publish: <T>(channel: string, event: string, payload: T) => Promise<void>;
  on: (event: string, listener: (payload: unknown) => void) => void;
  off?: (event: string, listener: (payload: unknown) => void) => void;
};

export function subscribePlanChannel(
  userId: string,
  onRemoteUpdate: (snapshot: PlanSnapshot) => void
): PlanRealtimeHandle {
  const client = getInsforgeClient();
  if (!client || !('realtime' in client)) {
    return {
      ready: Promise.resolve(false),
      publish: async () => {},
      unsubscribe: () => {},
    };
  }

  const realtime = (client as unknown as { realtime: AnyRealtime }).realtime;
  const channel = planChannel(userId);
  const myClientId = getClientId();

  const handler = (payload: unknown) => {
    if (!payload || typeof payload !== 'object') return;
    const p = payload as Partial<PlanUpdatedPayload>;
    if (!p.snapshot || p.clientId === myClientId) return;
    onRemoteUpdate(p.snapshot);
  };

  const ready = (async () => {
    try {
      if (!realtime.isConnected?.()) {
        await realtime.connect();
      }
      const res = await realtime.subscribe(channel);
      if (res?.error) {
        console.warn('Realtime subscribe failed:', res.error);
        return false;
      }
      realtime.on(PLAN_UPDATED_EVENT, handler);
      return true;
    } catch (err) {
      console.warn('Realtime init error:', err);
      return false;
    }
  })();

  return {
    ready,
    publish: async (snapshot: PlanSnapshot) => {
      try {
        const ok = await ready;
        if (!ok) return;
        await realtime.publish<PlanUpdatedPayload>(channel, PLAN_UPDATED_EVENT, {
          clientId: myClientId,
          snapshot,
          at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Realtime publish failed:', err);
      }
    },
    unsubscribe: () => {
      try {
        realtime.off?.(PLAN_UPDATED_EVENT, handler);
        realtime.unsubscribe(channel);
      } catch {
        /* noop */
      }
    },
  };
}
