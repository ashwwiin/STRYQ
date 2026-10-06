'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { formatNumber, calculate1RM } from '@/lib/math';
import { loadActiveWorkoutDraft, clearActiveWorkoutDraft } from '@/lib/storage';

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
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
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
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
        if (data.workouts) setWorkouts(data.workouts);
        if (data.templates) setTemplates(data.templates);

        // Update local cache for 0ms instant reload next time
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

  useEffect(() => {
    // ⚡ INSTANT 0ms HYDRATION: Load cached dashboard state immediately
    try {
      const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.user) setUser(parsed.user);
        if (Array.isArray(parsed.workouts)) setWorkouts(parsed.workouts);
        if (Array.isArray(parsed.templates)) setTemplates(parsed.templates);
        // If we have cached data, immediately set loading to false
        if (parsed.user || (parsed.workouts && parsed.workouts.length > 0)) {
          setLoading(false);
        }
      }
    } catch {
      /* ignore */
    }

    // Background fetch to sync latest database state
    fetchData();
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

  const handleSaveStarterTemplate = async (starter: any) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(starter),
      });
      if (res.ok) {
        fetchData();
      }
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

  // Starter templates recommendation
  const starterTemplates = [
    {
      name: 'Push Power & Chest Hypertrophy',
      category: 'Push',
      notes: 'Focus on progressive overload on bench press.',
      exercises: [
        { name: 'Barbell Bench Press', isCompound: true, defaultSets: 3, defaultWeightKg: 80, defaultReps: 6 },
        { name: 'Incline Dumbbell Bench Press', isCompound: true, defaultSets: 3, defaultWeightKg: 28, defaultReps: 8 },
        { name: 'Dumbbell Lateral Raise', isCompound: false, defaultSets: 3, defaultWeightKg: 12, defaultReps: 12 },
        { name: 'Tricep Rope Pushdown', isCompound: false, defaultSets: 3, defaultWeightKg: 25, defaultReps: 12 },
      ],
    },
    {
      name: 'Heavy Pull & Deadlift Focus',
      category: 'Pull',
      notes: 'Warm up thoroughly before working deadlift sets.',
      exercises: [
        { name: 'Conventional Deadlift', isCompound: true, defaultSets: 3, defaultWeightKg: 120, defaultReps: 5 },
        { name: 'Barbell Bent-Over Row', isCompound: true, defaultSets: 3, defaultWeightKg: 70, defaultReps: 8 },
        { name: 'Pull-Up', isCompound: true, defaultSets: 3, defaultWeightKg: 0, defaultReps: 8 },
        { name: 'Incline Dumbbell Curl', isCompound: false, defaultSets: 3, defaultWeightKg: 14, defaultReps: 10 },
      ],
    },
    {
      name: 'Leg Day & Squat Progression',
      category: 'Legs',
      notes: 'Full depth on squats with 2-minute rests.',
      exercises: [
        { name: 'Barbell Back Squat', isCompound: true, defaultSets: 3, defaultWeightKg: 100, defaultReps: 5 },
        { name: 'Romanian Deadlift (RDL)', isCompound: true, defaultSets: 3, defaultWeightKg: 80, defaultReps: 8 },
        { name: 'Leg Press', isCompound: true, defaultSets: 3, defaultWeightKg: 160, defaultReps: 10 },
        { name: 'Leg Extension', isCompound: false, defaultSets: 3, defaultWeightKg: 50, defaultReps: 12 },
      ],
    },
  ];

  const stats = [
    { label: 'Lifetime tonnage', short: 'Tonnage', value: formatNumber(totalTonnage), unit: 'kg', note: 'Sum of weight × completed reps', icon: Dumbbell, accent: false },
    { label: 'Active MET burn', short: 'Calories', value: `~${formatNumber(totalCalories)}`, unit: 'kcal', note: 'Metabolic energy expenditure', icon: Flame, accent: true },
    { label: 'Logged sessions', short: 'Sessions', value: String(totalSessions), unit: 'logs', note: 'Recorded in database', icon: Trophy, accent: false },
    { label: 'Saved splits', short: 'Routines', value: String(templates.length), unit: 'routines', note: 'Stored in database', icon: BookmarkPlus, accent: false },
  ];

  return (
    <div className="min-h-screen w-full bg-white text-[#111] flex flex-col selection:bg-[#FF4A00] selection:text-white pb-10 sm:pb-24">
      <Header
        userWeight={user?.weightKg || 75}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
        userName={user?.name || 'Athlete'}
      />

      <main className="flex-1 w-full px-3.5 sm:px-8 lg:px-12 2xl:px-16 py-4 sm:py-8 space-y-5 sm:space-y-8 max-w-[1920px] mx-auto">
        {/* ───────── Hero ───────── */}
        <div className="w-full relative rounded-3xl overflow-hidden shadow-xl min-h-[300px] sm:min-h-[420px] lg:min-h-[500px] flex items-end sm:items-center bg-[#09090b] group">
          <Image
            src="/images/hero.jpg"
            alt="Strength Training"
            fill
            sizes="100vw"
            className="object-cover object-[55%_10%] sm:object-[center_12%] lg:object-[65%_15%] opacity-75 sm:opacity-80 group-hover:scale-105 transition-transform duration-1000 ease-out"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 via-40% to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 sm:hidden" />

          <div className="relative z-10 w-full p-5 sm:p-8 lg:p-12 sm:max-w-2xl space-y-3 sm:space-y-4 text-white">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="px-3 py-1 rounded-full bg-[#FF4A00] text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-md">
                STRYQ. ENGINE
              </span>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
                <CalendarIcon className="w-3 h-3 text-[#FF4A00]" />
                {todayFormatted}
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-300 sm:hidden">Hey, {firstName}</p>
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
                className="sm:hidden py-3 px-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/20 transition-all active:scale-95 text-center"
              >
                <History className="w-3.5 h-3.5 text-[#FF4A00] shrink-0" />
                <span className="truncate">Log past</span>
              </Link>

              <Link
                href="/calendar"
                className="sm:py-3 py-3 px-3 sm:px-6 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/20 transition-all active:scale-95 text-center"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-[#FF4A00] shrink-0" />
                <span className="truncate">Calendar</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ───────── Resume an unfinished workout ───────── */}
        {draft && (
          <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-3.5 sm:p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FF4A00] text-white">
              <Play className="h-4 w-4 fill-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black uppercase tracking-tight">Workout in progress</p>
              <p className="truncate text-xs font-medium text-zinc-600">
                {draft.title || 'Strength Workout'} &middot; {draft.exercises.length}{' '}
                {draft.exercises.length === 1 ? 'exercise' : 'exercises'} &middot; {draftDoneSets}{' '}
                {draftDoneSets === 1 ? 'set' : 'sets'} done
              </p>
            </div>
            <button
              onClick={discardDraft}
              aria-label="Discard unfinished workout"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-white hover:text-red-600"
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

        {/* ───────── Up next + weekly goal ───────── */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12 lg:gap-5">
          {loading ? (
            <>
              <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 lg:col-span-7" />
              <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 lg:col-span-5" />
            </>
          ) : (
            <>
              {/* Up next */}
              <section className="flex flex-col justify-between gap-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 lg:col-span-7">
                {upNext ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#FF4A00]">
                          {trainedToday ? 'Trained today · next up' : 'Up next'}
                        </p>
                        <h2 className="mt-1 truncate text-xl font-black uppercase tracking-tight sm:text-2xl">
                          {upNext.tpl.name}
                        </h2>
                        <p className="mt-0.5 text-xs font-medium text-zinc-500">
                          {upNext.tpl.exercises?.length || 0} exercises &middot;{' '}
                          {upNext.days === null
                            ? 'Not done yet'
                            : upNext.days === 0
                              ? 'Done earlier today'
                              : upNext.days === 1
                                ? 'Last done yesterday'
                                : `Last done ${upNext.days} days ago`}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#FF4A00]">
                        {upNext.tpl.category || 'Routine'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(upNext.tpl.exercises || []).slice(0, 4).map((ex: any, i: number) => (
                        <span key={i} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                          {ex.name}
                        </span>
                      ))}
                      {(upNext.tpl.exercises?.length || 0) > 4 && (
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                          +{upNext.tpl.exercises.length - 4} more
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/workout/active?templateId=${upNext.tpl._id}`}
                      className="flex items-center justify-center gap-2 rounded-full bg-[#FF4A00] py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-orange-600/25 transition hover:bg-[#e04000] active:scale-[0.99] sm:w-fit sm:px-9"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      Start this workout
                    </Link>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#FF4A00]">
                        {trainedToday ? 'Trained today' : 'Ready when you are'}
                      </p>
                      <h2 className="mt-1 text-xl font-black uppercase tracking-tight sm:text-2xl">
                        What are we training?
                      </h2>
                      <p className="mt-1 max-w-md text-sm text-zinc-500">
                        Save a routine and it will show up here as your next workout. Until then, start from
                        scratch or pick a preset split.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        href="/workout/active"
                        className="flex items-center justify-center gap-2 rounded-full bg-[#FF4A00] px-7 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-orange-600/25 transition hover:bg-[#e04000] active:scale-[0.99]"
                      >
                        <Dumbbell className="h-4 w-4" />
                        Start empty session
                      </Link>
                      <a
                        href="#routines"
                        className="flex items-center justify-center gap-2 rounded-full border border-zinc-300 px-7 py-3.5 text-sm font-black uppercase tracking-wider text-zinc-900 transition hover:border-zinc-900"
                      >
                        Browse splits
                      </a>
                    </div>
                  </>
                )}
              </section>

              {/* Weekly goal */}
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 lg:col-span-5">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0">
                    <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#F4F4F5" strokeWidth="8" />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke="#FF4A00"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 34 * goalPct} ${2 * Math.PI * 34}`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 grid place-items-center text-center">
                      <span className="font-mono text-lg font-black leading-none">
                        {week.sessions}
                        <span className="text-xs text-zinc-400">/{weeklyGoal}</span>
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-black uppercase tracking-tight">This week</h2>
                    <p className="text-xs font-medium text-zinc-500">
                      {week.sessions >= weeklyGoal
                        ? 'Goal reached. Nice work!'
                        : `${weeklyGoal - week.sessions} more to hit your goal`}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                      <Flame className="h-3.5 w-3.5 fill-[#FF4A00] text-[#FF4A00]" />
                      {weekStreak > 0
                        ? `${weekStreak} week${weekStreak === 1 ? '' : 's'} in a row`
                        : 'Start your streak this week'}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <button
                      onClick={() => changeGoal(1)}
                      disabled={weeklyGoal >= 7}
                      aria-label="Increase weekly goal"
                      className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Goal</span>
                    <button
                      onClick={() => changeGoal(-1)}
                      disabled={weeklyGoal <= 1}
                      aria-label="Decrease weekly goal"
                      className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <Link
                  href="/calendar"
                  aria-label="Open calendar"
                  className="mt-5 grid grid-cols-7 gap-1.5 rounded-xl transition active:opacity-70"
                >
                  {week.days.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-400">{d.label}</span>
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-full text-xs font-black ${d.count > 0
                            ? 'bg-[#FF4A00] text-white shadow-md shadow-orange-600/25'
                            : d.isToday
                              ? 'bg-[#111] text-white'
                              : d.isFuture
                                ? 'bg-zinc-50 text-zinc-300'
                                : 'bg-zinc-100 text-zinc-500'
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

        {/* ───────── Stats: one joined card on phones, separate cards on large screens ───────── */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white p-4 lg:p-5 space-y-1 lg:space-y-1.5 lg:rounded-2xl lg:border lg:border-zinc-200 lg:hover:shadow-md lg:transition-shadow"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate ${s.accent ? 'text-[#FF4A00]' : 'text-zinc-400'
                      }`}
                  >
                    <span className="sm:hidden">{s.short}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                  <span
                    className={`p-1.5 rounded-lg shrink-0 ${s.accent ? 'bg-orange-100 text-[#FF4A00]' : 'bg-orange-50 text-[#FF4A00]'
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${s.accent ? 'fill-[#FF4A00]' : ''}`} />
                  </span>
                </div>
                <p
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none ${s.accent ? 'text-[#FF4A00]' : 'text-zinc-900'
                    }`}
                >
                  {loading ? '—' : s.value}{' '}
                  <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 font-sans">{s.unit}</span>
                </p>
                <p className="hidden lg:block text-[10px] text-zinc-400 font-semibold truncate">{s.note}</p>
              </div>
            );
          })}
        </div>

        {/* ───────── Recent workouts + progress ───────── */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg sm:text-2xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2 truncate min-w-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF4A00] shrink-0" />
              <span>Recent Training</span>
            </h2>

            <Link
              href="/calendar"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#FF4A00] bg-orange-50 hover:bg-orange-100 rounded-full transition-colors shrink-0"
            >
              <CalendarIcon className="w-3 h-3" />
              <span>
                <span className="sm:hidden">Calendar</span>
                <span className="hidden sm:inline">Full Calendar &rarr;</span>
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
            {/* Chart and PRs come first on phones so you see progress before the long list */}
            <div className="order-first lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:sticky lg:top-24 lg:self-start space-y-4">
              <VolumeChart workouts={workouts} />

              {prs.length > 0 && (
                <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-tight">
                      <Trophy className="h-4 w-4 text-[#FF4A00]" />
                      Recent PRs
                    </h3>
                    <span className="text-[11px] font-semibold text-zinc-400">Estimated max</span>
                  </div>
                  <ul className="mt-3 grid gap-2">
                    {prs.slice(0, 4).map((pr, i) => (
                      <li key={i} className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-zinc-900">{pr.name}</p>
                          <p className="text-xs text-zinc-500">
                            {pr.weight} kg × {pr.reps} &middot; {daysAgoLabel(pr.date)}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-black text-emerald-700">
                          +{pr.gain < 1 ? pr.gain.toFixed(1) : Math.round(pr.gain)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            </div>

            {/* Recent workouts */}
            <div className="lg:col-span-8 lg:col-start-1 lg:row-start-1 space-y-3 sm:space-y-4">
              {loading &&
                [0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-zinc-100" />)}

              {workouts.slice(0, 5).map((workout) => (
                <WorkoutCard key={workout._id} workout={workout} onDelete={handleDeleteWorkout} />
              ))}

              {workouts.length > 5 && (
                <div className="text-center pt-1">
                  <Link
                    href="/calendar"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 py-3 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    <span>View all {workouts.length} workouts</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF4A00]" />
                  </Link>
                </div>
              )}

              {workouts.length === 0 && !loading && (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 sm:p-10 space-y-4 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-orange-50 text-[#FF4A00] flex items-center justify-center mx-auto">
                    <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-zinc-900">
                      No Workouts Logged Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 font-medium">
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
        <section id="routines" className="scroll-mt-24 space-y-4 sm:space-y-5 pt-5 sm:pt-6 border-t border-zinc-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-orange-50 text-[#FF4A00] shrink-0">
                <BookmarkPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-black text-zinc-900 tracking-tight uppercase truncate">
                  Splits &amp; Routines
                </h2>
                <p className="text-xs text-zinc-500 font-medium truncate hidden sm:block">
                  Launch pre-built splits or build your custom routines
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateTemplateOpen(true)}
              className="py-2 px-3.5 sm:py-2.5 sm:px-5 rounded-full bg-[#111] hover:bg-[#222] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF4A00]" />
              <span>New Split</span>
            </button>
          </div>

          {/* Your saved routines */}
          {templates.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Your Saved Routines ({templates.length})
              </span>
              <div className={`${SWIPE_ROW} lg:grid-cols-3`}>
                {templates.map((tpl) => (
                  <div
                    key={tpl._id}
                    className="shrink-0 snap-start w-[84%] sm:w-[60%] md:w-auto bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200 hover:border-zinc-900 flex flex-col justify-between space-y-3 sm:space-y-4 transition-all shadow-sm"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-[#FF4A00] border border-orange-100">
                          {tpl.category || 'Custom Split'}
                        </span>
                        <button
                          onClick={() => handleDeleteTemplate(tpl._id)}
                          className="grid h-8 w-8 -m-1 place-items-center rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          aria-label={`Delete ${tpl.name}`}
                          title="Delete Routine"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-sm sm:text-base font-black text-zinc-900 uppercase tracking-tight">
                          {tpl.name}
                        </h3>
                        {tpl.notes && (
                          <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5 font-medium">{tpl.notes}</p>
                        )}
                      </div>

                      <div className="space-y-1 pt-2 border-t border-zinc-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          {tpl.exercises?.length || 0} Movements
                        </span>
                        <div className="space-y-1">
                          {tpl.exercises?.slice(0, 3).map((ex: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-2 text-[11px] text-zinc-700">
                              <span className="font-semibold truncate">{ex.name}</span>
                              <span className="text-zinc-400 font-mono text-[10px] shrink-0">
                                {ex.defaultSets} &times; {ex.defaultWeightKg}kg
                              </span>
                            </div>
                          ))}
                          {tpl.exercises?.length > 3 && (
                            <p className="text-[10px] text-zinc-400 font-medium">
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
          )}

          {/* Preset splits */}
          <div className="space-y-2.5 pt-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
              {templates.length > 0 ? 'Explore Preset Splits' : 'Ready-to-Use Training Splits'}
            </span>

            <div className={`${SWIPE_ROW} md:grid-cols-3`}>
              {starterTemplates.map((starter, idx) => (
                <div
                  key={idx}
                  className="shrink-0 snap-start w-[84%] sm:w-[60%] md:w-auto bg-zinc-50/70 hover:bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200 hover:border-zinc-400 flex flex-col justify-between space-y-3 transition-all shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100/70 text-[#FF4A00]">
                        {starter.category}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        {starter.exercises.length} moves
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-zinc-900 uppercase tracking-tight">{starter.name}</h4>

                    <p className="text-xs text-zinc-500 line-clamp-2 font-medium">{starter.notes}</p>

                    <div className="space-y-1 pt-2 border-t border-zinc-200/60">
                      {starter.exercises.slice(0, 2).map((ex, exIdx) => (
                        <div key={exIdx} className="flex items-center justify-between gap-2 text-[11px] text-zinc-600">
                          <span className="font-medium truncate">{ex.name}</span>
                          <span className="font-mono text-zinc-400 text-[10px] shrink-0">
                            {ex.defaultSets} &times; {ex.defaultWeightKg}kg
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveStarterTemplate(starter)}
                    className="w-full py-3 sm:py-2 px-3.5 rounded-full bg-white hover:bg-zinc-900 hover:text-white border border-zinc-300 hover:border-zinc-900 text-zinc-900 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-[#FF4A00]" />
                    <span>Save Split Routine</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
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