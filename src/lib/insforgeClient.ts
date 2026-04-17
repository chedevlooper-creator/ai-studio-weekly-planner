import { createClient } from '@insforge/sdk';

let singleton: ReturnType<typeof createClient> | null = null;

export function getInsforgeClient() {
  if (singleton) return singleton;
  const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string | undefined;
  if (!baseUrl || !anonKey) return null;
  singleton = createClient({ baseUrl, anonKey });
  return singleton;
}
