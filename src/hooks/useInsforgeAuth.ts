import { useCallback, useEffect, useState } from 'react';
import { getInsforgeClient } from '../lib/insforgeClient';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified?: boolean;
}

function hasLikelyStoredSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const k = key.toLowerCase();
      if (!(k.includes('insforge') || k.includes('auth') || k.includes('session') || k.includes('token'))) {
        continue;
      }
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const v = raw.toLowerCase();
      if (v.includes('refresh') || v.includes('access') || v.includes('token')) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

function parseAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.email !== 'string') return null;
  return {
    id: o.id,
    email: o.email,
    emailVerified: typeof o.emailVerified === 'boolean' ? o.emailVerified : undefined,
  };
}

export function useInsforgeAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const client = getInsforgeClient();
    if (!client) {
      setError('InsForge ayarları eksik. .env.local içindeki VITE_INSFORGE_* değerlerini girin.');
      setLoading(false);
      return;
    }

    // Fresh visitors/guest mode usually have no persisted session.
    // Skip bootstrap request to avoid expected 401 + refresh-token warnings.
    if (!hasLikelyStoredSession()) {
      setLoading(false);
      return;
    }

    client.auth.getCurrentUser().then(({ data, error: authError }) => {
      if (authError) {
        const msg = authError.message ?? '';
        const lower = msg.toLowerCase();
        const expected = lower.includes('refresh token') || lower.includes('unauthorized') || lower.includes('not authorized');
        if (!expected) {
          setError('Kullanıcı bilgisi alınamadı.');
          console.warn('[Auth]', msg);
        }
      }
      setUser(parseAuthUser(data?.user));
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = getInsforgeClient();
    if (!client) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError('Giriş başarısız. E-posta veya şifrenizi kontrol edin.');
      console.warn('[Auth signIn]', error.message);
      return;
    }
    setUser(parseAuthUser(data?.user));
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const client = getInsforgeClient();
    if (!client) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const { data, error } = await client.auth.signUp({ email, password, name });
    setBusy(false);
    if (error) {
      setError('Kayıt başarısız. Bilgilerinizi kontrol edip tekrar deneyin.');
      console.warn('[Auth signUp]', error.message);
      return;
    }
    setUser(parseAuthUser(data?.user));
    if (data?.requireEmailVerification) {
      setNotice('E-posta doğrulaması gerekiyor. Lütfen gelen doğrulama kodu/linki ile hesabı doğrulayın.');
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = getInsforgeClient();
    if (!client) return;
    setBusy(true);
    setError(null);
    await client.auth.signOut();
    setUser(null);
    setBusy(false);
  }, []);

  return { user, loading, busy, error, notice, signIn, signUp, signOut };
}
