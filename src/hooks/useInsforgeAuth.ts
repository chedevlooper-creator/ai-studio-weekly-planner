import { useCallback, useEffect, useState } from 'react';
import { getInsforgeClient } from '../lib/insforgeClient';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified?: boolean;
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
    client.auth.getCurrentUser().then(({ data, error: authError }) => {
      if (authError) {
        const msg = authError.message ?? '';
        if (!msg.toLowerCase().includes('refresh token')) {
          setError('Kullanıcı bilgisi alınamadı.');
        }
        console.warn('[Auth]', msg);
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
