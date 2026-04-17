/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Download, Search, Upload, Cloud, CloudOff, Check, Loader2, LogOut, Zap, BarChart3, Users, Shield } from 'lucide-react';
import { useInsforgeAuth } from './hooks/useInsforgeAuth';
import { FILTER_OPTIONS, useWeeklyPlan } from './hooks/useWeeklyPlan';
import { DaySection } from './components/planner/DaySection';
import { RemindersPanel } from './components/planner/RemindersPanel';
import { TaskEditModal } from './components/planner/TaskEditModal';
import { TeamPanel } from './components/planner/TeamPanel';
import { ProgressRing } from './components/planner/ProgressRing';
import { FilePreviewModal } from './components/planner/FilePreviewModal';
import { findDayIndexByTaskId } from './lib/planDnd';
import type { TaskAttachment } from './types/plan';

export default function App() {
  const auth = useInsforgeAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [guestMode, setGuestMode] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);
  const guestId = useMemo(() => {
    if (typeof localStorage === 'undefined') return null;
    const key = 'guest-plan-user-id-v1';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = `guest-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`;
    localStorage.setItem(key, created);
    return created;
  }, []);
  const activeUserId = auth.user?.id ?? (guestMode ? guestId : null);
  const plan = useWeeklyPlan(activeUserId);
  const {
    data,
    expandedDays,
    toggleDay,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    fileInputRef,
    preparerName,
    setPreparerName,
    weekStart,
    setWeekStart,
    weekLabel,
    reminders,
    setReminderAt,
    editingNote,
    setEditingNote,
    taskModal,
    closeTaskModal,
    openAddTask,
    openEditTask,
    toggleTaskStatus,
    updateTaskNotes,
    deleteTask,
    addTaskWithFields,
    moveOrReorderTask,
    updateTaskFull,
    stats,
    assigneeStats,
    syncStatus,
    exportJson,
    importFromFile,
    quickAttachFiles,
  } = plan;

  const dragEnabled = filter === 'Tümü' && !searchQuery.trim();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      // Long-press to start drag on touch devices so taps/scroll still work.
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!dragEnabled) return;
      const { active, over } = event;
      if (!over) return;
      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId === overId) return;

      let toDay: number;
      let insertBefore: string | null;

      if (overId.startsWith('day-append-')) {
        const n = Number(overId.replace('day-append-', ''));
        if (Number.isNaN(n) || n < 0 || n >= data.length) return;
        toDay = n;
        insertBefore = null;
      } else {
        const d = findDayIndexByTaskId(data, overId);
        if (d < 0) return;
        toDay = d;
        insertBefore = overId;
      }

      moveOrReorderTask(activeId, toDay, insertBefore);
    },
    [data, dragEnabled, moveOrReorderTask]
  );

  const modalTask =
    taskModal?.mode === 'edit' ? data[taskModal.dayIndex]?.tasks.find((t) => t.id === taskModal.taskId) ?? null : null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await auth.signUp(authEmail.trim(), authPassword, authName.trim() || undefined);
      return;
    }
    await auth.signIn(authEmail.trim(), authPassword);
  };

  /* ─── Loading State ─── */
  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans text-neutral-50">
        <div className="flex flex-col items-center gap-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="relative">
            <div className="size-10 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
            <div className="absolute inset-0 size-10 animate-ping rounded-full border border-accent/10" />
          </div>
          <p className="text-sm font-medium text-neutral-500">Yükleniyor…</p>
        </div>
      </div>
    );
  }

  /* ─── Auth Gate ─── */
  if (!auth.user && !guestMode) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 font-sans text-neutral-50">
        {/* Background effects */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-40 -top-40 size-[500px] rounded-full bg-accent/[0.06] blur-[150px]" />
          <div className="absolute -bottom-20 -right-20 size-[400px] rounded-full bg-violet-500/[0.05] blur-[130px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-blue-500/[0.02] blur-[200px]" />
        </div>

        <div className="relative w-full max-w-[420px]" style={{ animation: 'scaleIn 0.3s ease-out' }}>
          <div className="glass-panel p-6 sm:p-8">
            {/* Branding */}
            <div className="mb-7 flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-violet-600 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                  <Zap className="size-7 text-white" aria-hidden />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-accent/20 blur-lg -z-10" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Kafkasder
                </h1>
                <p className="mt-1 text-sm text-neutral-400">
                  Görev Takip Sistemi
                </p>
              </div>
              <p className="max-w-xs text-[13px] leading-relaxed text-neutral-500">
                Devam etmek için giriş yapın veya misafir olarak kullanın.
              </p>
            </div>

            {/* Auth form */}
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
              {isSignUp && (
                <input
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Ad soyad"
                  className="input-field"
                />
              )}
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="E-posta"
                className="input-field"
                required
              />
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Şifre"
                className="input-field"
                required
                minLength={6}
              />
              <button
                type="submit"
                disabled={auth.busy}
                className="btn-primary mt-1 w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {auth.busy ? 'Lütfen bekleyin…' : isSignUp ? 'Kayıt ol' : 'Giriş yap'}
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp((v) => !v)}
                className="text-center text-xs text-neutral-500 hover:text-white transition-colors"
              >
                {isSignUp ? 'Hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kayıt ol'}
              </button>
              {auth.error && (
                <p className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-center text-xs text-rose-400">
                  {auth.error}
                </p>
              )}
              {auth.notice && (
                <p className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-center text-xs text-amber-300">
                  {auth.notice}
                </p>
              )}
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">veya</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            {/* Guest button */}
            <button
              type="button"
              onClick={() => setGuestMode(true)}
              className="btn-ghost w-full"
            >
              <Shield className="size-4 text-accent-light" aria-hidden />
              Misafir olarak devam et
            </button>
            <p className="mt-2 text-center text-[11px] text-neutral-600">
              Misafir modunda veriler yalnızca bu tarayıcıda saklanır.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main Application ─── */
  return (
    <div className="min-h-screen font-sans text-neutral-100">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importFromFile(f);
          e.target.value = '';
        }}
      />

      <div className="mx-auto flex w-full max-w-[min(96vw,1440px)] flex-col gap-4 px-2 py-4 sm:gap-6 sm:px-4 sm:py-6 lg:px-6 print:max-w-none">
        
        {/* ═══════════════════════════════════════════════════ */}
        {/* HEADER                                              */}
        {/* ═══════════════════════════════════════════════════ */}
        <header className="no-print overflow-hidden glass-panel animated-gradient-bg">
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            
            {/* ─── Mobile Header ─── */}
            <div className="flex flex-col gap-3 sm:hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-violet-600 shadow-[0_0_12px_rgba(99,102,241,0.25)]">
                    <Zap className="size-4 text-white" aria-hidden />
                  </div>
                  <div>
                    <h1 className="font-display text-[15px] font-bold tracking-tight text-white leading-none">
                      Kafkasder
                    </h1>
                    <p className="text-[9px] font-medium text-neutral-500 mt-0.5">Görev Takip</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" disabled={!activeUserId} onClick={exportJson} className="rounded-lg p-1.5 text-neutral-500 hover:bg-white/[0.06] hover:text-white disabled:opacity-40 transition-colors" aria-label="Dışa Aktar">
                    <Download className="size-3.5" />
                  </button>
                  <button type="button" disabled={!activeUserId} onClick={() => fileInputRef.current?.click()} className="rounded-lg p-1.5 text-neutral-500 hover:bg-white/[0.06] hover:text-white disabled:opacity-40 transition-colors" aria-label="İçe Aktar">
                    <Upload className="size-3.5" />
                  </button>
                  {auth.user && (
                    <button type="button" onClick={() => void auth.signOut()} className="rounded-lg p-1.5 text-neutral-500 hover:text-rose-400 transition-colors" aria-label="Çıkış">
                      <LogOut className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-2 py-1 text-[10px] font-bold tabular-nums text-white">
                    <BarChart3 className="size-2.5 text-accent-light" />
                    {stats.totalTasks}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15 px-2 py-1 text-[10px] font-bold tabular-nums text-emerald-400">
                    {stats.completed}✓
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-accent/10 border border-accent/15 px-2 py-1 text-[10px] font-bold tabular-nums text-accent-light">
                    %{stats.completionRate}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  {syncStatus === 'saving' && <><Loader2 className="size-3 animate-spin text-accent-light" /><span className="text-accent-light">…</span></>}
                  {syncStatus === 'saved' && <><Cloud className="size-3 text-emerald-400" /><span className="text-emerald-400">✓</span></>}
                  {syncStatus === 'error' && <><CloudOff className="size-3 text-rose-400" /><span className="text-rose-400">!</span></>}
                  {(syncStatus === 'idle' || syncStatus === 'local-only') && <Check className="size-3 text-neutral-600" />}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent via-accent-light to-emerald-400 transition-[width] duration-700 ease-in-out"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>

            {/* ─── Desktop Header ─── */}
            <div className="hidden sm:block">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_340px] lg:items-start">
                {/* Left: Branding & Stats */}
                <div className="relative">
                  {/* Decorative blurs */}
                  <div className="pointer-events-none absolute -left-20 -top-20 size-56 rounded-full bg-accent/[0.08] blur-[100px]" aria-hidden />
                  <div className="pointer-events-none absolute left-48 top-8 size-40 rounded-full bg-violet-500/[0.05] blur-[80px]" aria-hidden />
                  
                  <div className="relative flex flex-col gap-5 text-center lg:text-left items-center lg:items-start">
                    {/* Badge */}
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent-light backdrop-blur-md">
                      <Zap className="size-3.5" aria-hidden />
                      Kafkasder 2026
                    </div>

                    {/* Title */}
                    <div className="flex flex-col gap-2">
                      <h1 className="max-w-xl font-display text-3xl font-bold leading-tight tracking-tight text-white lg:text-4xl text-glow">
                        Görev Takip Sistemi
                      </h1>
                      <p className="max-w-2xl text-sm leading-7 text-neutral-400">
                        Görevleri düzenleyin, sorumluları netleştirin ve ilerlemeyi takip edin.
                        <span className="ml-1 text-accent-light/70">Kalıcı veri güvenliği ve bulut senkronizasyonu ile.</span>
                      </p>
                    </div>

                    {/* Stat cards */}
                    <div className="grid w-full grid-cols-3 gap-3 lg:max-w-xl">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-500">Toplam</p>
                        <p className="mt-1 font-display text-2xl leading-none font-bold text-white tabular-nums">{stats.totalTasks}</p>
                      </div>
                      <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] px-4 py-3 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/[0.06]">
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-500/60">Biten</p>
                        <p className="mt-1 font-display text-2xl leading-none font-bold text-emerald-400 tabular-nums">{stats.completed}</p>
                      </div>
                      <div className="rounded-xl border border-accent/10 bg-accent/[0.03] px-4 py-3 transition-all hover:border-accent/20 hover:bg-accent/[0.06]">
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-accent-light/60">Oran</p>
                        <p className="mt-1 font-display text-2xl leading-none font-bold text-accent-light tabular-nums">%{stats.completionRate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Session info, sync, actions */}
                <div className="flex flex-col gap-4 lg:justify-self-end w-full lg:max-w-[340px]">
                  {/* Session card */}
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3 backdrop-blur-md">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20">
                      <Users className="size-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                        {auth.user ? 'Güvenli Oturum' : 'Misafir Modu'}
                      </p>
                      <p className="truncate text-xs text-emerald-300/70">
                        {auth.user ? auth.user.email : 'Veriler yerel saklanır'}
                      </p>
                    </div>
                  </div>

                  {/* Sync status */}
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-xs backdrop-blur-md">
                    {syncStatus === 'saving' && <><Loader2 className="size-4 animate-spin text-accent-light" aria-hidden /><span className="font-medium text-accent-light">İşleniyor…</span></>}
                    {syncStatus === 'saved' && <><Cloud className="size-4 text-emerald-400" aria-hidden /><span className="font-medium text-emerald-300">Buluta Kaydedildi</span></>}
                    {syncStatus === 'error' && <><CloudOff className="size-4 text-rose-400" aria-hidden /><span className="font-medium text-rose-300">Bağlantı Hatası</span></>}
                    {(syncStatus === 'idle' || syncStatus === 'local-only') && <><Check className="size-4 text-neutral-500" aria-hidden /><span className="font-medium text-neutral-500">Senkronize Edildi</span></>}
                  </div>

                  {/* Ring chart + team (desktop only) */}
                  <div className="hidden lg:flex items-start gap-4">
                    <ProgressRing value={stats.completionRate} size={72} strokeWidth={5} />
                    <div className="flex-1 min-w-0">
                      <TeamPanel assigneeStats={assigneeStats} compact className="border-none bg-transparent p-0 shadow-none" />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                    <button type="button" disabled={!activeUserId} onClick={exportJson} className="btn-ghost flex-1 lg:flex-none min-h-[40px] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                      <Download className="size-3.5" aria-hidden />
                      Dışa Aktar
                    </button>
                    <button type="button" disabled={!activeUserId} onClick={() => fileInputRef.current?.click()} className="btn-ghost flex-1 lg:flex-none min-h-[40px] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                      <Upload className="size-3.5" aria-hidden />
                      İçe Aktar
                    </button>
                    {auth.user && (
                      <button type="button" onClick={() => void auth.signOut()} className="btn-ghost min-h-[40px] text-sm font-semibold text-neutral-500 hover:text-rose-400">
                        <LogOut className="size-3.5" aria-hidden />
                        Çıkış
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Guest mode banner */}
        {!auth.user && guestMode && (
          <section className="glass-panel border-accent/15 bg-accent/[0.03] px-3 py-2.5 text-[11px] sm:px-4 sm:py-3 sm:text-sm text-accent-light/80 flex items-center gap-2.5" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="size-1.5 rounded-full bg-accent animate-pulse shrink-0" />
            Senkronizasyon için hesap oluşturun.
          </section>
        )}

        {/* Print header */}
        <div className="hidden print:block mb-8 border-b border-neutral-300 pb-4">
          <h1 className="font-display text-2xl font-bold text-black tracking-tight">Haftalık Planlama Raporu</h1>
          <p className="text-sm text-neutral-600 mt-1">{weekLabel}</p>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* PERFORMANCE SECTION (desktop only)                  */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="hidden sm:block glass-panel px-6 py-6 lg:px-8 lg:py-8 print:border-neutral-300 print:bg-white">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                <BarChart3 className="size-3 text-accent" aria-hidden />
                Performans Özeti
              </p>
              <p className="text-[15px] leading-relaxed text-neutral-300 print:text-black">
                <span className="font-bold text-white">{stats.totalTasks}</span> görev planlandı. 
                <span className="font-bold text-emerald-400"> {stats.completed} bitti</span>, 
                <span className="font-bold text-amber-400"> {stats.inProgress} devam</span> ve 
                <span className="text-neutral-400"> {stats.waiting} beklemede</span>.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                <span>Tamamlanma Oranı</span>
                <span className="text-accent-light tabular-nums">%{stats.completionRate}</span>
              </div>
              <div className="no-print mt-4 h-2 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent via-accent-light to-emerald-400 transition-[width] duration-700 ease-in-out"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FILTER + SEARCH                                     */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="no-print flex items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-1 p-2 sm:gap-3 sm:rounded-2xl sm:p-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[11px] text-white outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs"
            aria-label="Filtre"
          >
            {FILTER_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <div className="relative flex flex-1 items-center">
            <Search className="pointer-events-none absolute left-2.5 size-3 text-neutral-600 sm:left-3 sm:size-3.5" aria-hidden />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Görev ara… (/ tuşu)"
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] py-1.5 pl-7 pr-2 text-[11px] text-white outline-none placeholder:text-neutral-600 focus:border-accent/30 focus:ring-1 focus:ring-accent/10 sm:rounded-xl sm:py-2 sm:pl-9 sm:pr-3 sm:text-xs"
              autoComplete="off"
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* DAY SECTIONS (DnD grid)                             */}
        {/* ═══════════════════════════════════════════════════ */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
          autoScroll={{ acceleration: 14, threshold: { x: 0.12, y: 0.12 } }}
        >
          <div className="grid grid-cols-1 gap-3 pb-6 sm:gap-5 sm:pb-10 lg:grid-cols-2 2xl:grid-cols-3">
            {data.map((dayData, dayIndex) => (
              <Fragment key={dayData.day}>
                <DaySection
                  dayData={dayData}
                  dayIndex={dayIndex}
                  expanded={expandedDays.includes(dayData.day)}
                  onToggleExpand={() => toggleDay(dayData.day)}
                  filter={filter}
                  searchQuery={searchQuery}
                  dragEnabled={dragEnabled}
                  editingNote={editingNote}
                  onToggleTaskStatus={(taskId) => toggleTaskStatus(dayIndex, taskId)}
                  onUpdateTaskNotes={(taskId, notes) => updateTaskNotes(dayIndex, taskId, notes)}
                  onEditingNoteClose={() => setEditingNote(null)}
                  onStartEditNote={(taskId) => setEditingNote({ dayIndex, taskId })}
                  onAddTask={() => openAddTask(dayIndex)}
                  onEditTask={(taskId) => openEditTask(dayIndex, taskId)}
                  onQuickAttachFiles={(taskId, files) => quickAttachFiles(dayIndex, taskId, files)}
                  onPreviewAttachment={setPreviewAttachment}
                />
              </Fragment>
            ))}
          </div>
        </DndContext>

        {/* ═══════════════════════════════════════════════════ */}
        {/* BOTTOM PANELS                                       */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="no-print flex flex-col gap-4 sm:gap-6">
          <div className="lg:hidden">
            <TeamPanel assigneeStats={assigneeStats} />
          </div>
          <RemindersPanel reminders={reminders} onChange={setReminderAt} />
        </div>
      </div>

      {/* Task modal */}
      <TaskEditModal
        modal={taskModal}
        days={data}
        task={modalTask}
        onClose={closeTaskModal}
        onAdd={addTaskWithFields}
        onUpdate={updateTaskFull}
        onDelete={deleteTask}
        ownerId={activeUserId}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}
