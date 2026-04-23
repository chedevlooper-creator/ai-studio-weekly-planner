import React, { useState, useMemo } from 'react';
import { Zap, Shield } from 'lucide-react';
import { useInsforgeAuth } from '../../hooks/useInsforgeAuth';

interface AuthGateProps {
  children: (params: {
    user: ReturnType<typeof useInsforgeAuth>['user'];
    auth: ReturnType<typeof useInsforgeAuth>;
    /** InsForge user id only; null in guest mode (no remote plan sync). */
    syncUserId: string | null;
    /** Auth id or stable guest id — export/import, attachments, display. */
    activeUserId: string | null;
  }) => React.ReactNode;
  onGuestMode: () => void;
  guestMode: boolean;
  guestId: string | null;
}

export function AuthGate({ children, onGuestMode, guestMode, guestId }: AuthGateProps) {
  const auth = useInsforgeAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Only authenticated users sync to InsForge; guests use local storage only.
  const syncUserId = auth.user?.id ?? null;
  const activeUserId = auth.user?.id ?? (guestMode ? guestId : null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await auth.signUp(authEmail.trim(), authPassword, authName.trim() || undefined);
      return;
    }
    await auth.signIn(authEmail.trim(), authPassword);
  };

  /* Loading */
  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans text-zinc-50">
        <div className="flex flex-col items-center gap-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="relative">
            <div className="size-10 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
            <div className="absolute inset-0 size-10 animate-ping rounded-full border border-accent/10" />
          </div>
          <p className="text-sm font-medium text-zinc-500">Yükleniyor…</p>
        </div>
      </div>
    );
  }

  /* Auth form */
  if (!auth.user && !guestMode) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 font-sans text-zinc-50">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-40 -top-40 size-[500px] rounded-full bg-accent/[0.06] blur-[150px]" />
          <div className="absolute -bottom-20 -right-20 size-[400px] rounded-full bg-violet-500/[0.05] blur-[130px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-blue-500/[0.02] blur-[200px]" />
        </div>

        <div className="relative w-full max-w-[420px]" style={{ animation: 'scaleIn 0.3s ease-out' }}>
          <div className="glass-panel p-6 sm:p-8">
            <div className="mb-7 flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-violet-500 shadow-[0_0_28px_rgba(124,131,255,0.28)]">
                  <Zap className="size-7 text-white" aria-hidden />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-accent/20 blur-lg -z-10" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Kafkasder</h1>
                <p className="mt-1 text-sm text-zinc-400">Görev Takip Sistemi</p>
              </div>
              <p className="max-w-xs text-[13px] leading-relaxed text-zinc-500">
                Devam etmek için giriş yapın veya misafir olarak kullanın.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
              {isSignUp && (
                <>
                  <label htmlFor="auth-name" className="sr-only">Ad soyad</label>
                  <input id="auth-name" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Ad soyad" className="input-field" />
                </>
              )}
              <label htmlFor="auth-email" className="sr-only">E-posta</label>
              <input id="auth-email" type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="E-posta" className="input-field" required />
              <label htmlFor="auth-password" className="sr-only">Şifre</label>
              <input id="auth-password" type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Şifre" className="input-field" required minLength={6} />
              <button type="submit" disabled={auth.busy} className="btn-primary mt-1 w-full disabled:cursor-not-allowed disabled:opacity-60">
                {auth.busy ? 'Lütfen bekleyin…' : isSignUp ? 'Kayıt ol' : 'Giriş yap'}
              </button>
              <button type="button" onClick={() => setIsSignUp((v) => !v)} className="text-center text-xs text-zinc-500 hover:text-white transition-colors">
                {isSignUp ? 'Hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kayıt ol'}
              </button>
              {auth.error && (
                <p className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-center text-xs text-rose-400">{auth.error}</p>
              )}
              {auth.notice && (
                <p className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-center text-xs text-amber-300">{auth.notice}</p>
              )}
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">veya</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <button type="button" onClick={onGuestMode} className="btn-ghost w-full">
              <Shield className="size-4 text-accent-light" aria-hidden />
              Misafir olarak devam et
            </button>
            <p className="mt-2 text-center text-[11px] text-zinc-600">
              Misafir modunda veriler yalnızca bu tarayıcıda saklanır.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children({ user: auth.user, auth, syncUserId, activeUserId })}</>;
}
