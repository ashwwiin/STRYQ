'use client';

import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import VolumeChart from '@/components/VolumeChart';
import WorkoutCard from '@/components/WorkoutCard';
import WeightQuickEditModal from '@/components/WeightQuickEditModal';
import CreateTemplateModal from '@/components/CreateTemplateModal';
import {
  Dumbbell,
  Plus,
  Flame,
  ArrowRight,
  Calendar as CalendarIcon,
  Trophy,
  BookmarkPlus,
  Trash2,
  Play,
  Layers,
  History,
  Minus,
  X,
  Sparkles,
} from 'lucide-react';
import { formatNumber, calculate1RM } from '@/lib/math';
import { loadActiveWorkoutDraft, clearActiveWorkoutDraft, getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/storage';

/* Runs before paint on the client; falls back to useEffect during SSR to avoid warnings */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/* Local-time yyyy-mm-dd, so "today" matches what the user sees */
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const GOAL_KEY = 'stryq_weekly_goal';

/* Monday of the week a date falls in, as yyyy-mm-dd */
const weekKeyOf = (d: Date) =>
  ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));

const daysAgoLabel = (ts: number) => {
  const d = Math.floor((Date.now() - ts) / 86400000);
  return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;
};

/* Horizontal swipe row on phones, normal grid from md up */
const SWIPE_ROW =
  'flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-3.5 px-3.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ' +
  'md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:gap-5';

const DASHBOARD_CACHE_KEY = 'stryq_dashboard_cache';

export default function DashboardPage() {
  /*
   * IMPORTANT: the initial state must be identical on the server and on the
   * client's first render, otherwise React throws a hydration error.
   * Cached data from localStorage is applied in a layout effect below,
   * which runs after hydration but before the browser paints.
   */
  const [user, setUser] = useState<{
    id?: string;
    name: string;
    email?: string;
    weightKg: number;
  } | null>(null);

  const [workouts, setWorkouts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);

  // Unfinished live workout saved on this device, and the weekly goal
  const [draft, setDraft] = useState<any | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState(4);

  const fetchData = async () => {
    try {
      // 1-flight unified dashboard fetch
      const res = await fetch('/api/dashboard');
      if (res.status === 401) {
        clearCachedUser();
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          saveCachedUser(data.user);
        }
        if (data.workouts) setWorkouts(data.workouts);
        if (data.templates) setTemplates(data.templates);

        // Update local cache for instant reload next time
        try {
          localStorage.setItem(
            DASHBOARD_CACHE_KEY,
            JSON.stringify({
              user: data.user,
              workouts: data.workouts || [],
              templates: data.templates || [],
              cachedAt: Date.now(),
            })
          );
        } catch {
          /* ignore storage limits */
        }
      } else {
        // Fallback to individual endpoints if dashboard route is unavailable
        const [userRes, workoutsRes, templatesRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/workouts'),
          fetch('/api/templates'),
        ]);

        if (userRes.status === 401) {
          clearCachedUser();
          window.location.href = '/login';
          return;
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }
        if (workoutsRes.ok) {
          const wData = await workoutsRes.json();
          setWorkouts(wData.workouts || []);
        }
        if (templatesRes.ok) {
          const tData = await templatesRes.json();
          setTemplates(tData.templates || []);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply cached dashboard state after hydration but before paint (no skeleton flash, no mismatch)
  useIsoLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
      const cachedUser = getCachedUser();
      if (raw) {
        const parsed = JSON.parse(raw);
        const cachedWorkouts = Array.isArray(parsed.workouts) ? parsed.workouts : [];
        const cachedTemplates = Array.isArray(parsed.templates) ? parsed.templates : [];
        const u = parsed.user || cachedUser || null;
        if (u) setUser(u);
        setWorkouts(cachedWorkouts);
        setTemplates(cachedTemplates);
        setLoading(false);
      } else if (cachedUser) {
        setUser(cachedUser);
        setLoading(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Background fetch to sync latest database state
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const d = loadActiveWorkoutDraft();
      if (d && d.exercises && d.exercises.length > 0) setDraft(d);
      const g = Number(localStorage.getItem(GOAL_KEY));
      if (g >= 1 && g <= 7) setWeeklyGoal(g);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const changeGoal = (delta: number) =>
    setWeeklyGoal((prev) => {
      const next = Math.min(7, Math.max(1, prev + delta));
      try {
        localStorage.setItem(GOAL_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });

  const discardDraft = () => {
    if (window.confirm('Discard this unfinished workout? Your logged sets will be lost.')) {
      clearActiveWorkoutDraft();
      setDraft(null);
    }
  };

  const updateLocalCache = (partial: { user?: any; workouts?: any[]; templates?: any[] }) => {
    try {
      const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
      const existing = cached ? JSON.parse(cached) : {};
      localStorage.setItem(
        DASHBOARD_CACHE_KEY,
        JSON.stringify({
          ...existing,
          ...partial,
          cachedAt: Date.now(),
        })
      );
    } catch {
      /* ignore */
    }
  };

  const handleSaveWeight = async (newWeight: number) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightKg: newWeight }),
      });

      if (res.ok) {
        setUser((prev) => {
          const next = prev ? { ...prev, weightKg: newWeight } : null;
          if (next) updateLocalCache({ user: next });
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      await fetch(`/api/workouts/${workoutId}`, { method: 'DELETE' });
      setWorkouts((prev) => {
        const next = prev.filter((w) => w._id !== workoutId);
        updateLocalCache({ workouts: next });
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await fetch(`/api/templates/${templateId}`, { method: 'DELETE' });
      setTemplates((prev) => {
        const next = prev.filter((t) => t._id !== templateId);
        updateLocalCache({ templates: next });
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const totalTonnage = workouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);
  const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const totalSessions = workouts.length;

  const firstName = (user?.name || 'Athlete').split(' ')[0];

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  /* ───── This week (Mon–Sun) for the day strip ───── */
  const week = useMemo(() => {
    const now = new Date();
    const offset = (now.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const counts: Record<string, number> = {};
    for (const w of workouts) {
      if (!w.createdAt) continue;
      const k = ymd(new Date(w.createdAt));
      counts[k] = (counts[k] || 0) + 1;
    }
    const todayKey = ymd(now);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = ymd(d);
      return {
        label: 'MTWTFSS'[i],
        date: d.getDate(),
        count: counts[key] || 0,
        isToday: key === todayKey,
        isFuture: key > todayKey,
      };
    });
    return { days, sessions: days.reduce((a, d) => a + d.count, 0) };
  }, [workouts]);

  /* ───── Weekly goal: weeks in a row where you hit it ───── */
  const weekStreak = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of workouts) {
      if (!w.createdAt) continue;
      const k = weekKeyOf(new Date(w.createdAt));
      counts[k] = (counts[k] || 0) + 1;
    }
    const now = new Date();
    const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    // The current week counts if you've already hit the goal; it never breaks a streak before it ends
    let streak = (counts[ymd(thisMonday)] || 0) >= weeklyGoal ? 1 : 0;
    for (let i = 1; i < 520; i++) {
      const d = new Date(thisMonday);
      d.setDate(thisMonday.getDate() - 7 * i);
      if ((counts[ymd(d)] || 0) >= weeklyGoal) streak++;
      else break;
    }
    return streak;
  }, [workouts, weeklyGoal]);

  /* ───── Up next: the saved routine you haven't done for the longest ───── */
  const upNext = useMemo(() => {
    const lastByName: Record<string, number> = {};
    for (const w of workouts) {
      const k = (w.title || '').trim().toLowerCase();
      if (!k || !w.createdAt) continue;
      const t = new Date(w.createdAt).getTime();
      if (!lastByName[k] || t > lastByName[k]) lastByName[k] = t;
    }
    const items = templates
      .map((tpl, i) => ({ tpl, i, last: lastByName[(tpl.name || '').trim().toLowerCase()] || 0 }))
      .sort((a, b) => a.last - b.last || a.i - b.i);
    const pick = items[0];
    if (!pick) return null;
    return {
      tpl: pick.tpl,
      days: pick.last ? Math.floor((Date.now() - pick.last) / 86400000) : null,
    };
  }, [workouts, templates]);

  /* ───── Personal records: a set whose estimated 1RM beats everything before it ───── */
  const prs = useMemo(() => {
    const sorted = workouts
      .filter((w) => w.createdAt)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const best: Record<string, number> = {};
    const out: { name: string; weight: number; reps: number; date: number; gain: number }[] = [];

    for (const w of sorted) {
      const top: Record<string, { e: number; weight: number; reps: number; name: string }> = {};
      for (const ex of w.exercises || []) {
        const key = (ex.name || '').trim().toLowerCase();
        if (!key) continue;
        for (const st of ex.sets || []) {
          if (!st.completed || st.isWarmup || !(st.reps > 0) || !(st.weightKg > 0)) continue;
          const e = calculate1RM(st.weightKg, st.reps);
          if (!top[key] || e > top[key].e) top[key] = { e, weight: st.weightKg, reps: st.reps, name: ex.name };
        }
      }
      for (const [key, t] of Object.entries(top)) {
        const prev = best[key] || 0;
        // The first time you log an exercise sets the baseline; it isn't a record
        if (prev > 0 && t.e > prev) {
          out.push({
            name: t.name,
            weight: t.weight,
            reps: t.reps,
            date: new Date(w.createdAt).getTime(),
            gain: (t.e / prev - 1) * 100,
          });
        }
        best[key] = Math.max(prev, t.e);
      }
    }
    return out.sort((a, b) => b.date - a.date).slice(0, 5);
  }, [workouts]);

  const trainedToday = week.days.some((d) => d.isToday && d.count > 0);
  const goalPct = Math.min(1, week.sessions / weeklyGoal);
  const draftDoneSets = draft
    ? (draft.exercises || []).reduce(
      (a: number, ex: any) => a + (ex.sets || []).filter((st: any) => st.completed).length,
      0
    )
    : 0;

  // This week metrics for delta indicators
  const thisWeekWorkouts = workouts.filter((w) => {
    if (!w.createdAt) return false;
    return weekKeyOf(new Date(w.createdAt)) === weekKeyOf(new Date());
  });
  const weekVolume = thisWeekWorkouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);
  const weekCalories = thisWeekWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col selection:bg-[#FF4A00] selection:text-white pb-10 sm:pb-24">
      <Header
        userWeight={user?.weightKg}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
        userName={user?.name}
      />

      <main className="flex-1 w-full px-3.5 sm:px-8 lg:px-12 2xl:px-16 py-4 sm:py-8 space-y-6 sm:space-y-8 max-w-[1920px] mx-auto">
        {/* ───────── Hero ───────── */}
        <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl min-h-[300px] sm:min-h-[420px] lg:min-h-[480px] flex items-end sm:items-center bg-[#09090b] border border-zinc-800/80 group">
          <Image
            src="/images/hero.jpg"
            alt="Strength Training"
            fill
            sizes="100vw"
            className="object-cover object-[55%_10%] sm:object-[center_12%] lg:object-[65%_15%] opacity-60 sm:opacity-70 group-hover:scale-105 transition-transform duration-1000 ease-out"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 via-45% to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent sm:hidden" />

          <div className="relative z-10 w-full p-5 sm:p-8 lg:p-12 sm:max-w-2xl space-y-3 sm:space-y-4 text-white">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="px-3 py-1 rounded-full bg-[#FF4A00] text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-md">
                STRYQ. ENGINE
              </span>
              <span
                suppressHydrationWarning
                className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10"
              >
                <CalendarIcon className="w-3 h-3 text-[#FF4A00]" />
                {todayFormatted}
              </span>
            </div>

            <div>
              <p
                suppressHydrationWarning
                className="text-sm font-semibold text-zinc-300 sm:hidden"
              >
                Hey, {firstName}
              </p>
              <h1 className="text-[1.65rem] sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.05] sm:leading-tight uppercase">
                Heavy Sets. <br />
                <span className="text-[#FF4A00]">Complete Logs.</span>
              </h1>
            </div>

            <p className="hidden sm:block text-sm text-zinc-300 font-medium max-w-lg leading-relaxed">
              Track strength progression, log set-by-set tonnage, and execute split routines with real-time Epley math.
            </p>

            <div className="pt-1 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3.5">
              <Link
                href="/workout/active"
                className="col-span-2 py-3.5 sm:py-3 px-4 sm:px-7 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-600/30 active:scale-95 transition-all text-center"
              >
                <Dumbbell className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span className="truncate">Start Session</span>
              </Link>

              <Link
                href="/workout/active?mode=past"
                className="sm:hidden py-3 px-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/15 transition-all active:scale-95 text-center"
              >
                <History className="w-3.5 h-3.5 text-[#FF4A00] shrink-0" />
                <span className="truncate">Log past</span>
              </Link>

              <Link
                href="/calendar"
                className="sm:py-3 py-3 px-3 sm:px-6 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/15 transition-all active:scale-95 text-center"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-[#FF4A00] shrink-0" />
                <span className="truncate">Calendar</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ───────── Resume an unfinished workout ───────── */}
        {draft && (
          <div className="flex items-center gap-3 rounded-2xl border border-orange-500/30 bg-[#1e1410] p-3.5 sm:p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FF4A00] text-white shadow-md">
              <Play className="h-4 w-4 fill-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black uppercase tracking-tight text-white">Workout in progress</p>
              <p className="truncate text-xs font-medium text-zinc-400">
                {draft.title || 'Strength Workout'} &middot; {draft.exercises.length}{' '}
                {draft.exercises.length === 1 ? 'exercise' : 'exercises'} &middot; {draftDoneSets}{' '}
                {draftDoneSets === 1 ? 'set' : 'sets'} done
              </p>
            </div>
            <button
              onClick={discardDraft}
              aria-label="Discard unfinished workout"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-800 hover:text-red-400"
            >
              <X className="h-4 w-4" />
            </button>
            <Link
              href="/workout/active"
              className="shrink-0 rounded-full bg-[#FF4A00] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-orange-600/25 transition hover:bg-[#e04000] active:scale-95"
            >
              Resume
            </Link>
          </div>
        )}

        {/* ───────── Top 4 Telemetry Metric Stat Cards (Screenshot 3) ───────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {/* 1. Lifetime Tonnage */}
          <div className="bg-[#141417] rounded-2xl sm:rounded-3xl border border-zinc-800/80 p-4 sm:p-5 flex flex-col justify-between space-y-2 shadow-sm hover:border-zinc-700/80 transition-all">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 grid place-items-center font-black text-sm shadow-inner">
                <span>H</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-400 mt-3 block">
                Lifetime Tonnage
              </span>
              <p suppressHydrationWarning className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-1">
                {loading ? '—' : formatNumber(totalTonnage)}{' '}
                <span className="text-xs sm:text-sm font-bold text-zinc-500 font-sans">kg</span>
              </p>
            </div>
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 pt-1">
              <span>&uarr;</span>
              <span>{formatNumber(weekVolume)} this week</span>
            </p>
          </div>

          {/* 2. MET Burn */}
          <div className="bg-[#141417] rounded-2xl sm:rounded-3xl border border-zinc-800/80 p-4 sm:p-5 flex flex-col justify-between space-y-2 shadow-sm hover:border-zinc-700/80 transition-all">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/20 text-[#FF4A00] grid place-items-center shadow-inner">
                <Flame className="w-5 h-5 fill-[#FF4A00]" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-400 mt-3 block">
                Met Burn
              </span>
              <p suppressHydrationWarning className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#FF4A00] mt-1">
                {loading ? '—' : `~${formatNumber(totalCalories)}`}{' '}
                <span className="text-xs sm:text-sm font-bold text-zinc-500 font-sans">kcal</span>
              </p>
            </div>
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 pt-1">
              <span>&uarr;</span>
              <span>{formatNumber(weekCalories)} this week</span>
            </p>
          </div>

          {/* 3. Logged Sessions */}
          <div className="bg-[#141417] rounded-2xl sm:rounded-3xl border border-zinc-800/80 p-4 sm:p-5 flex flex-col justify-between space-y-2 shadow-sm hover:border-zinc-700/80 transition-all">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 grid place-items-center shadow-inner">
                <Trophy className="w-5 h-5 text-zinc-300" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-400 mt-3 block">
                Logged Sessions
              </span>
              <p suppressHydrationWarning className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-1">
                {loading ? '—' : totalSessions}{' '}
                <span className="text-xs sm:text-sm font-bold text-zinc-500 font-sans">sessions</span>
              </p>
            </div>
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 pt-1">
              <span>{week.sessions} this week</span>
            </p>
          </div>

          {/* 4. Saved Splits */}
          <div className="bg-[#141417] rounded-2xl sm:rounded-3xl border border-zinc-800/80 p-4 sm:p-5 flex flex-col justify-between space-y-2 shadow-sm hover:border-zinc-700/80 transition-all">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 grid place-items-center shadow-inner">
                <BookmarkPlus className="w-5 h-5 text-zinc-300" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-400 mt-3 block">
                Saved Splits
              </span>
              <p suppressHydrationWarning className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-1">
                {loading ? '—' : templates.length}{' '}
                <span className="text-xs sm:text-sm font-bold text-zinc-500 font-sans">routines</span>
              </p>
            </div>
            <p className="text-xs font-bold text-emerald-400 truncate pt-1">
              {templates.length > 0
                ? `${templates.slice(0, 2).map((t) => t.category || t.name).join('/')}${templates.length > 2 ? ` + ${templates.length - 2}` : ''}`
                : 'Ready to build'}
            </p>
          </div>
        </div>

        {/* ───────── Up next + weekly goal ───────── */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12 lg:gap-5">
          {loading ? (
            <>
              <div className="h-48 animate-pulse rounded-2xl bg-zinc-900 lg:col-span-7" />
              <div className="h-48 animate-pulse rounded-2xl bg-zinc-900 lg:col-span-5" />
            </>
          ) : (
            <>
              {/* Up next / Launchpad */}
              <section className="flex flex-col justify-between gap-6 rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-[#141417] p-6 sm:p-7 shadow-sm transition-shadow hover:border-zinc-700/80 lg:col-span-7">
                {upNext ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/25 text-[#FF4A00] text-[10px] font-black uppercase tracking-wider">
                          <Dumbbell className="w-3 h-3" />
                          {trainedToday ? 'Trained Today · Up Next' : 'Up Next Routine'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                          {upNext.tpl.category || 'Routine'}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                          {upNext.tpl.name}
                        </h2>
                        <p className="text-xs text-zinc-400 font-medium mt-1">
                          {upNext.tpl.exercises?.length || 0} exercises scheduled &middot;{' '}
                          {upNext.days === null
                            ? 'Not logged yet'
                            : upNext.days === 0
                              ? 'Completed earlier today'
                              : upNext.days === 1
                                ? 'Last done yesterday'
                                : `Last done ${upNext.days} days ago`}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(upNext.tpl.exercises || []).slice(0, 4).map((ex: any, i: number) => (
                          <span key={i} className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300">
                            {ex.name}
                          </span>
                        ))}
                        {(upNext.tpl.exercises?.length || 0) > 4 && (
                          <span className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-500">
                            +{upNext.tpl.exercises.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-zinc-800/80">
                      <Link
                        href={`/workout/active?templateId=${upNext.tpl._id}`}
                        className="flex-1 py-3.5 px-6 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 active:scale-95 transition-all text-center"
                      >
                        <Play className="h-4 w-4 fill-white" />
                        <span>Start This Workout</span>
                      </Link>

                      <Link
                        href="/workout/active"
                        className="py-3.5 px-6 rounded-full border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Blank Session</span>
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/25 text-[#FF4A00] text-[10px] font-black uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" />
                          Ready To Train
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          STRYQ Protocol
                        </span>
                      </div>

                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                          Choose Your Session.
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1 leading-relaxed">
                          Log exercise sets with live 1RM math and calorie burn, or execute a structured split routine.
                        </p>
                      </div>

                      {/* 3 clean athletic split cards */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
                        <a
                          href="#routines"
                          className="rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 p-3 sm:p-3.5 transition-all text-left group"
                        >
                          <span className="text-[10px] font-black text-[#FF4A00] uppercase tracking-wider block">Push</span>
                          <span className="text-xs font-bold text-white block mt-0.5">Chest &amp; Arms</span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5 font-medium">4 exercises</span>
                        </a>

                        <a
                          href="#routines"
                          className="rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 p-3 sm:p-3.5 transition-all text-left group"
                        >
                          <span className="text-[10px] font-black text-[#FF4A00] uppercase tracking-wider block">Pull</span>
                          <span className="text-xs font-bold text-white block mt-0.5">Back &amp; Deadlift</span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5 font-medium">4 exercises</span>
                        </a>

                        <a
                          href="#routines"
                          className="rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 p-3 sm:p-3.5 transition-all text-left group"
                        >
                          <span className="text-[10px] font-black text-[#FF4A00] uppercase tracking-wider block">Legs</span>
                          <span className="text-xs font-bold text-white block mt-0.5">Squats &amp; Hams</span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5 font-medium">4 exercises</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-zinc-800/80">
                      <Link
                        href="/workout/active"
                        className="flex-1 py-3.5 px-6 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 active:scale-95 transition-all text-center"
                      >
                        <Dumbbell className="h-4 w-4" />
                        <span>Start Blank Session</span>
                      </Link>

                      <a
                        href="#routines"
                        className="py-3.5 px-6 rounded-full border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
                      >
                        <Layers className="h-4 w-4 text-zinc-400" />
                        <span>Browse Splits</span>
                      </a>
                    </div>
                  </>
                )}
              </section>

              {/* Weekly goal & Consistency */}
              <section className="flex flex-col justify-between gap-5 rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-[#141417] p-6 sm:p-7 shadow-sm transition-shadow hover:border-zinc-700/80 lg:col-span-5">
                <div className="space-y-4">
                  {/* Top Bar: Title, streak badge, and Goal controls */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black uppercase tracking-tight text-white">
                        This Week
                      </h2>
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/15 text-[#FF4A00] border border-orange-500/25 text-[10px] font-black uppercase tracking-wider">
                        <Flame className="w-3 h-3 fill-[#FF4A00]" />
                        {weekStreak > 0 ? `${weekStreak}w Streak` : 'Consistency'}
                      </span>
                    </div>

                    {/* Compact Goal Stepper */}
                    <div className="flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-1 border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => changeGoal(-1)}
                        disabled={weeklyGoal <= 1}
                        aria-label="Decrease weekly goal"
                        className="w-5 h-5 rounded-full grid place-items-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-30"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-[11px] font-black text-white px-1">
                        {weeklyGoal}/wk
                      </span>
                      <button
                        type="button"
                        onClick={() => changeGoal(1)}
                        disabled={weeklyGoal >= 7}
                        aria-label="Increase weekly goal"
                        className="w-5 h-5 rounded-full grid place-items-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-30"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar and summary */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span suppressHydrationWarning className="font-bold text-zinc-300">
                        {week.sessions} of {weeklyGoal} workouts logged
                      </span>
                      <span suppressHydrationWarning className="font-mono font-black text-[#FF4A00]">
                        {Math.round(goalPct * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        style={{ width: `${Math.min(100, Math.round(goalPct * 100))}%` }}
                        className="h-full bg-gradient-to-r from-[#e04000] to-[#FF4A00] rounded-full transition-all duration-500 shadow-sm shadow-orange-500/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Day strip */}
                <Link
                  href="/calendar"
                  aria-label="Open full training calendar"
                  className="pt-3 border-t border-zinc-800/80 grid grid-cols-7 gap-1.5"
                >
                  {week.days.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 group">
                      <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        {d.label}
                      </span>
                      <span
                        suppressHydrationWarning
                        className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-black transition-all ${
                          d.count > 0
                            ? 'bg-[#FF4A00] text-white shadow-md shadow-orange-600/30'
                            : d.isToday
                              ? 'bg-zinc-800 text-white ring-2 ring-[#FF4A00]'
                              : 'bg-zinc-900 text-zinc-400 border border-zinc-800/80 group-hover:bg-zinc-800'
                        }`}
                      >
                        {d.count > 0 ? <Dumbbell className="h-4 w-4" /> : d.date}
                      </span>
                    </div>
                  ))}
                </Link>
              </section>
            </>
          )}
        </div>

        {/* ───────── Recent workouts + progress ───────── */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase flex items-center gap-2 truncate min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4A00] shadow-[0_0_8px_#FF4A00]" />
              <span>Recent Training</span>
            </h2>

            <Link
              href="/calendar"
              className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              <span>View All &rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
            {/* Chart and PRs come first on phones so you see progress before the long list */}
            <div className="order-first lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:sticky lg:top-24 lg:self-start space-y-4">
              <VolumeChart workouts={workouts} />

              {/* Recent PRs Leaderboard (Screenshot 2) */}
              {prs.length > 0 && (
                <section className="rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-[#141417] p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      <Trophy className="h-4 w-4 text-[#FF4A00]" />
                      Recent PRs
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Est. 1RM</span>
                  </div>

                  <ul className="grid gap-2 pt-1">
                    {prs.slice(0, 4).map((pr, i) => {
                      const rankBadges = [
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                        'bg-zinc-800 text-zinc-300 border border-zinc-700',
                        'bg-zinc-800 text-zinc-400 border border-zinc-700',
                        'bg-zinc-900 text-zinc-500 border border-zinc-800',
                      ];

                      return (
                        <li key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg grid place-items-center text-xs font-mono font-bold shrink-0 ${rankBadges[i] || rankBadges[3]}`}>
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-white uppercase">{pr.name}</p>
                              <p suppressHydrationWarning className="text-xs text-zinc-400 font-medium">
                                {pr.weight} kg &times; {pr.reps} &middot; {daysAgoLabel(pr.date)}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 font-mono text-xs font-black text-emerald-400">
                            +{pr.gain < 1 ? pr.gain.toFixed(1) : Math.round(pr.gain)}%
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>

            {/* Recent workouts list */}
            <div className="lg:col-span-8 lg:col-start-1 lg:row-start-1 space-y-3 sm:space-y-4">
              {loading &&
                [0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-900" />)}

              {!loading && workouts.length > 0 && (
                <div className="bg-[#141417] rounded-2xl sm:rounded-3xl border border-zinc-800/80 divide-y divide-zinc-800/60 overflow-hidden shadow-sm">
                  {workouts.slice(0, 5).map((workout) => (
                    <WorkoutCard
                      key={workout._id}
                      workout={workout}
                      onDelete={handleDeleteWorkout}
                      isListItem
                    />
                  ))}
                </div>
              )}

              {workouts.length > 5 && (
                <div className="text-center pt-1">
                  <Link
                    href="/calendar"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 py-3 px-6 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    <span>View all {workouts.length} workouts</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF4A00]" />
                  </Link>
                </div>
              )}

              {workouts.length === 0 && !loading && (
                <div className="rounded-2xl sm:rounded-3xl border border-dashed border-zinc-800 bg-[#141417] p-6 sm:p-10 space-y-4 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-orange-500/15 text-[#FF4A00] flex items-center justify-center mx-auto">
                    <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-white">
                      No Workouts Logged Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                      Start your first training session or pick a split routine below.
                    </p>
                  </div>
                  <Link
                    href="/workout/active"
                    className="inline-flex items-center gap-1.5 py-3 px-6 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Start First Workout</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ───────── Splits & routines ───────── */}
        <section id="routines" className="scroll-mt-24 space-y-4 sm:space-y-5 pt-5 sm:pt-6 border-t border-zinc-800/80">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-orange-500/15 text-[#FF4A00] shrink-0">
                <BookmarkPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight uppercase truncate">
                  Splits &amp; Routines
                </h2>
                <p className="text-xs text-zinc-400 font-medium truncate hidden sm:block">
                  Launch pre-built splits or build your custom routines
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateTemplateOpen(true)}
              className="py-2 px-3.5 sm:py-2.5 sm:px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF4A00]" />
              <span>New Split</span>
            </button>
          </div>

          {/* Your saved routines */}
          {templates.length > 0 ? (
            <div className="space-y-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Your Saved Routines ({templates.length})
              </span>
              <div className={`${SWIPE_ROW} lg:grid-cols-3`}>
                {templates.map((tpl) => (
                  <div
                    key={tpl._id}
                    className="shrink-0 snap-start w-[84%] sm:w-[60%] md:w-auto bg-[#141417] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-zinc-800/80 hover:border-zinc-700 flex flex-col justify-between space-y-3 sm:space-y-4 transition-all shadow-sm"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/15 text-[#FF4A00] border border-orange-500/20">
                          {tpl.category || 'Custom Split'}
                        </span>
                        <button
                          onClick={() => handleDeleteTemplate(tpl._id)}
                          className="grid h-8 w-8 -m-1 place-items-center rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          aria-label={`Delete ${tpl.name}`}
                          title="Delete Routine"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                          {tpl.name}
                        </h3>
                        {tpl.notes && (
                          <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5 font-medium">{tpl.notes}</p>
                        )}
                      </div>

                      <div className="space-y-1 pt-2 border-t border-zinc-800/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          {tpl.exercises?.length || 0} Movements
                        </span>
                        <div className="space-y-1">
                          {tpl.exercises?.slice(0, 3).map((ex: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-2 text-[11px] text-zinc-300">
                              <span className="font-semibold truncate">{ex.name}</span>
                              <span className="text-zinc-500 font-mono text-[10px] shrink-0">
                                {ex.defaultSets} &times; {ex.defaultWeightKg}kg
                              </span>
                            </div>
                          ))}
                          {tpl.exercises?.length > 3 && (
                            <p className="text-[10px] text-zinc-500 font-medium">
                              +{tpl.exercises.length - 3} more movements
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/workout/active?templateId=${tpl._id}`}
                      className="w-full py-3 sm:py-2.5 px-4 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Start Workout</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl sm:rounded-3xl border border-dashed border-zinc-800 p-8 text-center bg-[#141417] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-[#FF4A00] flex items-center justify-center mx-auto">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase">No Saved Routines Yet</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-0.5 font-medium">
                  Create your custom training routines or save workouts directly from the active workout page.
                </p>
              </div>
              <button
                onClick={() => setIsCreateTemplateOpen(true)}
                className="py-2.5 px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4 text-[#FF4A00]" />
                <span>Create Routine</span>
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <CreateTemplateModal
        isOpen={isCreateTemplateOpen}
        onClose={() => setIsCreateTemplateOpen(false)}
        onTemplateSaved={fetchData}
      />

      <WeightQuickEditModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        currentWeight={user?.weightKg || 75}
        onSaveWeight={handleSaveWeight}
      />
    </div>
  );
}