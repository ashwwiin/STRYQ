'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  formatDuration,
  calculate1RM,
  calculateCalories,
  calculateTotalVolume,
  formatNumber,
} from '@/lib/math';
import {
  saveActiveWorkoutDraft,
  loadActiveWorkoutDraft,
  clearActiveWorkoutDraft,
  queueOfflineWorkout,
  getCachedUser,
  saveCachedUser,
  clearCachedUser,
} from '@/lib/storage';
import { triggerVibration } from '@/lib/sound';
import Header from '@/components/Header';
import WeightQuickEditModal from '@/components/WeightQuickEditModal';
import AddExerciseModal from '@/components/AddExerciseModal';
import RestTimerModal from '@/components/RestTimerModal';
import FinishWorkoutModal from '@/components/FinishWorkoutModal';
import SaveAsTemplateModal from '@/components/SaveAsTemplateModal';
import MuscleMap from '@/components/MuscleMap'
import {
  Plus,
  Minus,
  Trash2,
  Check,
  RotateCcw,
  Dumbbell,
  Pause,
  Play,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Link2,
  StickyNote,
  Trophy,
  BookmarkPlus,
  X,
} from 'lucide-react';

/* ───────────────────────── Types ───────────────────────── */

interface WorkoutSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  est1RM: number;
  completed: boolean;
  previous?: string;
  isWarmup?: boolean;
}

interface ActiveExercise {
  id: string;
  name: string;
  isCompound: boolean;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  sets: WorkoutSet[];
  note?: string;
  supersetWithNext?: boolean;
}

interface HistoryEntry {
  last: { weightKg: number; reps: number }[]; // sets from the most recent workout
  best: number; // best estimated 1RM ever (used only for the "new best" badge)
}

interface Template {
  id: string;
  name: string;
  exercises: {
    name: string;
    isCompound: boolean;
    sets: { weightKg: number; reps: number }[];
  }[];
}

interface Toast {
  id: number;
  message: string;
  undo?: () => void;
}

/* ───────────────────────── Constants / helpers ───────────────────────── */

/* One shared column layout so the labels and every set row line up */
const SET_GRID =
  'grid grid-cols-[24px_minmax(0,1fr)_minmax(0,1fr)_38px_20px] sm:grid-cols-[28px_96px_minmax(0,1fr)_minmax(0,1fr)_44px_24px] items-center gap-1.5 sm:gap-3';

const TEMPLATES_KEY = 'stryq_templates';
const REST_KEY = 'stryq_rest_seconds';
const AUTO_REST_KEY = 'stryq_auto_rest';

const nameKey = (name: string) => name.trim().toLowerCase();

const pad = (n: number) => String(n).padStart(2, '0');
const formatLocalDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatLocalTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable; ignore */
  }
}

/* ───────────────────────── Page ───────────────────────── */

function ActiveWorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const urlMode = searchParams.get('mode');
  const urlDate = searchParams.get('date');

  const [workoutTitle, setWorkoutTitle] = useState('Strength Workout');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false); // starts only when the user taps Start
  const [userWeightKg, setUserWeightKg] = useState(() => getCachedUser()?.weightKg || 75);
  const [userName, setUserName] = useState(() => getCachedUser()?.name || 'Athlete');

  const [exercises, setExercises] = useState<ActiveExercise[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Preferences
  const [restSeconds, setRestSeconds] = useState(90);
  const [autoRest, setAutoRest] = useState(true);

  // Live workout vs. adding a workout after the fact
  const [mode, setMode] = useState<'live' | 'past'>(urlMode === 'past' ? 'past' : 'live');
  const [pastDate, setPastDate] = useState(urlDate || '');
  const [pastTime, setPastTime] = useState('');
  const [pastMinutes, setPastMinutes] = useState<number | null>(null); // null = use the estimate

  // History (previous numbers + personal bests)
  const [history, setHistory] = useState<Record<string, HistoryEntry>>({});

  // Templates from Database
  const [templates, setTemplates] = useState<any[]>([]);

  // UI state
  const [activeSet, setActiveSet] = useState<{ ex: string; set: number } | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const elapsedRef = useRef(0);
  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  /* ───── Toast helper ───── */
  const showToast = useCallback((message: string, undo?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, undo });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.templates)) {
          setTemplates(data.templates);
        }
      }
    } catch (err) {
      console.error('Error fetching templates from DB:', err);
    }
  }, []);

  /* ───── Initial load: user, draft, history, preferences, templates ───── */
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          clearCachedUser();
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUserWeightKg(data.user.weightKg || 75);
          setUserName(data.user.name || 'Athlete');
          saveCachedUser(data.user);
        }
      })
      .catch(() => { });

    // Previous numbers + personal bests come from the workouts you already saved
    fetch('/api/workouts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list: any[] = data?.workouts || [];
        const sorted = [...list].sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        const map: Record<string, HistoryEntry> = {};
        for (const w of sorted) {
          for (const ex of w.exercises || []) {
            const key = nameKey(ex.name || '');
            if (!key) continue;
            const done = (ex.sets || []).filter((s: any) => s.completed && !s.isWarmup);
            if (!map[key]) map[key] = { last: [], best: 0 };
            if (map[key].last.length === 0 && done.length > 0) {
              map[key].last = done.map((s: any) => ({ weightKg: s.weightKg, reps: s.reps }));
            }
            for (const s of done) {
              map[key].best = Math.max(map[key].best, calculate1RM(s.weightKg, s.reps));
            }
          }
        }
        setHistory(map);
      })
      .catch(() => { });

    // Only restore draft if templateId and custom date are not present
    if (!templateId && !urlDate) {
      const draft = loadActiveWorkoutDraft();
      if (draft && draft.exercises && draft.exercises.length > 0) {
        setWorkoutTitle(draft.title || 'Strength Workout');
        setElapsedSeconds(draft.elapsedSeconds || 0);
        setExercises(draft.exercises);
      }
    }

    const now = new Date();
    if (urlDate) {
      setPastDate(urlDate);
    } else {
      setPastDate(formatLocalDate(now));
    }
    setPastTime(formatLocalTime(new Date(now.getTime() - 60 * 60 * 1000))); // default: an hour ago

    if (urlMode === 'past') {
      setMode('past');
    }

    setRestSeconds(readLocal<number>(REST_KEY, 90));
    setAutoRest(readLocal<boolean>(AUTO_REST_KEY, true));
    fetchTemplates();
  }, [router, fetchTemplates, templateId, urlDate, urlMode]);

  /* ───── Accurate timer: computed from the clock, not by adding 1 each tick ───── */
  useEffect(() => {
    if (!isTimerRunning) return;
    const startedAt = Date.now();
    const base = elapsedRef.current;
    const interval = setInterval(() => {
      setElapsedSeconds(base + Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  /* ───── Keep the screen awake while this page is open ───── */
  useEffect(() => {
    let lock: any = null;
    const request = async () => {
      try {
        if ('wakeLock' in navigator) {
          lock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        /* not supported or denied */
      }
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      try {
        lock?.release?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  /* ───── Warn before leaving with unsaved progress ───── */
  const hasProgress = exercises.some((e) => e.sets.some((s) => s.completed)) || elapsedSeconds > 0;
  useEffect(() => {
    if (!hasProgress) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasProgress]);

  /* ───── Draft autosave ───── */
  useEffect(() => {
    if (mode === 'live' && exercises.length > 0) {
      saveActiveWorkoutDraft({
        title: workoutTitle,
        startTime: Date.now() - elapsedSeconds * 1000,
        elapsedSeconds,
        exercises,
        lastSavedAt: Date.now(),
      });
    }
  }, [exercises, elapsedSeconds, workoutTitle, mode]);

  /* ───── Totals (warm-up sets are not counted) ───── */
  const statExercises = exercises.map((ex) => ({ ...ex, sets: ex.sets.filter((s) => !s.isWarmup) }));
  const totalVolume = calculateTotalVolume(statExercises);
  const completedSetsCount = statExercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );

  // Duration: timed (live), typed in (past), or estimated from the sets when nobody timed it
  const allCompletedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const estimateMinutes = allCompletedSets > 0 ? Math.max(5, Math.round(allCompletedSets * 2.5)) : 0;
  const pastDurationMin = pastMinutes ?? estimateMinutes;
  const liveEstimated = mode === 'live' && elapsedSeconds === 0 && allCompletedSets > 0;
  const durationSeconds =
    mode === 'past' ? pastDurationMin * 60 : liveEstimated ? estimateMinutes * 60 : elapsedSeconds;
  const durationIsEstimated = mode === 'past' ? pastMinutes === null : liveEstimated;
  const totalCalories = calculateCalories(durationSeconds, userWeightKg, statExercises);

  const pastStart = mode === 'past' && pastDate && pastTime ? new Date(`${pastDate}T${pastTime}`) : null;
  const pastInFuture = !!pastStart && pastStart.getTime() > Date.now();
  const todayLocal = formatLocalDate(new Date());

  const switchMode = (m: 'live' | 'past') => {
    if (m === mode) return;
    setMode(m);
    if (m === 'past') {
      setIsTimerRunning(false);
      // Sets typed in for a past workout count as done
      setExercises((prev) =>
        prev.map((ex) => ({
          ...ex,
          sets: ex.sets.map((s) =>
            !s.completed && s.weightKg > 0 && s.reps > 0 ? { ...s, completed: true } : s
          ),
        }))
      );
    }
  };

  /* ───── Exercise / set handlers ───── */

  const updateExercise = (exIndex: number, fn: (ex: ActiveExercise) => ActiveExercise) => {
    setExercises((prev) => prev.map((ex, i) => (i === exIndex ? fn(ex) : ex)));
  };

  const handleAddExercise = (exercise: {
    name: string;
    isCompound: boolean;
    defaultWeightKg: number;
    defaultReps: number;
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
  }) => {
    // Start from last time's numbers when we have them
    const last = history[nameKey(exercise.name)]?.last?.[0];
    const weight = last?.weightKg ?? (exercise.defaultWeightKg || 0);
    const reps = last?.reps ?? (exercise.defaultReps || 0);

    const newEx: ActiveExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: exercise.name,
      isCompound: exercise.isCompound,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      sets: [
        {
          setNumber: 1,
          weightKg: weight,
          reps,
          est1RM: calculate1RM(weight, reps),
          completed: mode === 'past',
        },
      ],
    };

    setExercises((prev) => [...prev, newEx]);
    triggerVibration([50]);
  };

  const handleSwapExercise = (exercise: {
    name: string;
    isCompound: boolean;
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
  }) => {
    if (swapIndex === null) return;
    updateExercise(swapIndex, (ex) => ({
      ...ex,
      name: exercise.name,
      isCompound: exercise.isCompound,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
    }));
    setSwapIndex(null);
  };

  const handleDeleteExercise = (exId: string) => {
    const snapshot = exercises;
    const name = exercises.find((e) => e.id === exId)?.name || 'Exercise';
    setExercises((prev) => prev.filter((ex) => ex.id !== exId));
    showToast(`${name} removed`, () => setExercises(snapshot));
  };

  const handleMoveExercise = (exIndex: number, dir: -1 | 1) => {
    const target = exIndex + dir;
    if (target < 0 || target >= exercises.length) return;
    setExercises((prev) => {
      const next = [...prev];
      [next[exIndex], next[target]] = [next[target], next[exIndex]];
      return next;
    });
  };

  const handleAddSet = (exIndex: number) => {
    updateExercise(exIndex, (ex) => {
      const lastSet = ex.sets[ex.sets.length - 1];
      const weight = lastSet ? lastSet.weightKg : 0;
      const reps = lastSet ? lastSet.reps : 0;
      return {
        ...ex,
        sets: [
          ...ex.sets,
          {
            setNumber: ex.sets.length + 1,
            weightKg: weight,
            reps,
            est1RM: calculate1RM(weight, reps),
            completed: mode === 'past',
          },
        ],
      };
    });
    triggerVibration([50]);
  };

  const handleDeleteSet = (exIndex: number, setIndex: number) => {
    const snapshot = exercises;
    updateExercise(exIndex, (ex) => ({
      ...ex,
      sets: ex.sets.filter((_, idx) => idx !== setIndex).map((s, idx) => ({ ...s, setNumber: idx + 1 })),
    }));
    showToast('Set deleted', () => setExercises(snapshot));
  };

  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    field: 'weightKg' | 'reps',
    val: number
  ) => {
    updateExercise(exIndex, (ex) => ({
      ...ex,
      sets: ex.sets.map((s, i) => {
        if (i !== setIndex) return s;
        const next = { ...s, [field]: Math.max(0, val) };
        next.est1RM = calculate1RM(next.weightKg, next.reps);
        return next;
      }),
    }));
  };

  const adjustSet = (exIndex: number, setIndex: number, field: 'weightKg' | 'reps', delta: number) => {
    const current = exercises[exIndex].sets[setIndex][field];
    handleUpdateSet(exIndex, setIndex, field, Math.round((current + delta) * 100) / 100);
  };

  const handleToggleWarmup = (exIndex: number, setIndex: number) => {
    updateExercise(exIndex, (ex) => ({
      ...ex,
      sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, isWarmup: !s.isWarmup } : s)),
    }));
  };

  const isNewBest = (exName: string, set: WorkoutSet) => {
    const best = history[nameKey(exName)]?.best || 0;
    return set.completed && !set.isWarmup && best > 0 && calculate1RM(set.weightKg, set.reps) > best;
  };

  const handleToggleComplete = (exIndex: number, setIndex: number) => {
    const ex = exercises[exIndex];
    const set = ex.sets[setIndex];
    const nowCompleted = !set.completed;

    updateExercise(exIndex, (e) => ({
      ...e,
      sets: e.sets.map((s, i) =>
        i === setIndex ? { ...s, completed: nowCompleted, est1RM: calculate1RM(s.weightKg, s.reps) } : s
      ),
    }));
    setActiveSet(null);

    if (nowCompleted) {
      triggerVibration([100, 50, 100]);

      if (isNewBest(ex.name, { ...set, completed: true })) {
        showToast(`New best on ${ex.name}!`);
      }
      // In a superset, rest only after the second exercise of the pair
      if (mode === 'live' && autoRest && !ex.supersetWithNext) setIsRestTimerOpen(true);
    }
  };

  /* ───── Timer reset & Workout Discard ───── */
  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    setConfirmReset(false);
  };

  const handleDiscardWorkout = () => {
    clearActiveWorkoutDraft();
    setExercises([]);
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    setIsTimerRunning(false);
    setWorkoutTitle('Strength Workout');
    showToast('Workout cleared');
  };

  /* ───── Templates (MongoDB Integration) ───── */
  const handleStartTemplate = useCallback((tpl: any) => {
    setWorkoutTitle(tpl.name || 'Strength Workout');
    const mappedExercises: ActiveExercise[] = (tpl.exercises || []).map((ex: any, i: number) => {
      const defaultSetsCount = ex.defaultSets || (ex.sets ? ex.sets.length : 3);
      const weight = ex.defaultWeightKg !== undefined ? ex.defaultWeightKg : (ex.sets?.[0]?.weightKg || 0);
      const reps = ex.defaultReps !== undefined ? ex.defaultReps : (ex.sets?.[0]?.reps || 8);

      const setsList: WorkoutSet[] = [];
      if (ex.sets && Array.isArray(ex.sets) && ex.sets.length > 0) {
        ex.sets.forEach((s: any, idx: number) => {
          setsList.push({
            setNumber: idx + 1,
            weightKg: s.weightKg || 0,
            reps: s.reps || 0,
            est1RM: calculate1RM(s.weightKg || 0, s.reps || 0),
            completed: mode === 'past',
          });
        });
      } else {
        for (let sIdx = 1; sIdx <= defaultSetsCount; sIdx++) {
          setsList.push({
            setNumber: sIdx,
            weightKg: weight,
            reps: reps,
            est1RM: calculate1RM(weight, reps),
            completed: mode === 'past',
          });
        }
      }

      return {
        id: `ex_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        name: ex.name,
        isCompound: Boolean(ex.isCompound),
        sets: setsList.length > 0 ? setsList : [{ setNumber: 1, weightKg: 0, reps: 0, est1RM: 0, completed: mode === 'past' }],
      };
    });

    setExercises(mappedExercises);
    showToast(`Loaded routine: ${tpl.name}`);
  }, [mode, showToast]);

  useEffect(() => {
    if (templateId) {
      fetch(`/api/templates/${templateId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.template) {
            handleStartTemplate(data.template);
          }
        })
        .catch((err) => console.error('Error loading template from DB:', err));
    }
  }, [templateId, handleStartTemplate]);

  const handleSaveTemplate = () => {
    if (exercises.length === 0) {
      showToast('Add at least one exercise before saving as a template');
      return;
    }
    setIsSaveTemplateModalOpen(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t: any) => (t._id || t.id) !== id));
        showToast('Template deleted from database');
      } else {
        showToast('Failed to delete template');
      }
    } catch (err) {
      console.error('Delete template error:', err);
      showToast('Error deleting template');
    }
  };

  /* ───── Weight + save ───── */
  const handleSaveWeight = async (newWeight: number) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightKg: newWeight }),
      });
      if (res.ok) setUserWeightKg(newWeight);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAndSync = async () => {
    const finalWorkoutPayload = {
      title: workoutTitle,
      durationSeconds,
      totalVolumeKg: totalVolume,
      caloriesBurned: totalCalories,
      userWeightKg,
      exercises,
      syncedToStrava: false,
      durationEstimated: durationIsEstimated,
      manualEntry: mode === 'past',
      // For a past workout, save it on the day it happened
      ...(pastStart
        ? { createdAt: pastStart.toISOString(), startedAt: pastStart.toISOString() }
        : {}),
    };

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalWorkoutPayload),
      });

      if (!res.ok) {
        queueOfflineWorkout(finalWorkoutPayload);
      }

      clearActiveWorkoutDraft();
      router.push('/calendar');
    } catch (err) {
      console.error('Failed to complete workout:', err);
      queueOfflineWorkout(finalWorkoutPayload);
      clearActiveWorkoutDraft();
      router.push('/calendar');
    }
  };

  /* ───── Keyboard flow: Enter in kg → reps, Enter in reps → mark done ───── */
  const focusField = (id: string) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    el?.focus();
    el?.select();
  };

  const liveStats = [
    { label: 'Weight lifted', value: `${formatNumber(totalVolume)} kg`, color: 'text-[#FF4A00]' },
    {
      label: durationIsEstimated && allCompletedSets > 0 ? 'Calories (estimated)' : 'Calories',
      value: `~${totalCalories} kcal`,
      color: 'text-zinc-900',
    },
    { label: 'Sets done', value: String(completedSetsCount), color: 'text-emerald-600' },
  ];

  /* ───────────────────────── Render ───────────────────────── */

  return (
    <div className="flex min-h-screen w-full flex-col bg-white pb-28 text-[#111] selection:bg-[#FF4A00] selection:text-white">
      <Header
        userWeight={userWeightKg}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
        userName={userName}
      />

      <main className="mx-auto w-full max-w-[1920px] flex-1 space-y-4 px-3 py-4 sm:space-y-6 sm:px-8 sm:py-8 lg:px-12 2xl:px-16 overflow-x-hidden">
        {/* Workout name */}
        <section className="min-w-0">
          <label htmlFor="workout-title" className="text-xs font-semibold text-zinc-500">
            Workout name
          </label>
          <input
            id="workout-title"
            type="text"
            value={workoutTitle}
            onChange={(e) => setWorkoutTitle(e.target.value)}
            className="mt-1 w-full border-none bg-transparent p-0 text-xl font-black uppercase tracking-tight text-zinc-900 placeholder-zinc-300 focus:outline-none focus:ring-0 sm:text-4xl"
            placeholder="Name your workout"
          />

          <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
            <div className="inline-flex rounded-full bg-zinc-100 p-1" role="tablist" aria-label="Workout type">
              {(['live', 'past'] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition sm:px-5 sm:py-2 sm:text-[13px] ${
                    mode === m ? 'bg-[#111] text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {m === 'live' ? 'Live workout' : 'Log a past workout'}
                </button>
              ))}
            </div>

            {exercises.length > 0 && (
              <button
                type="button"
                onClick={handleDiscardWorkout}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 sm:px-4 sm:py-2"
              >
                Clear / Start Fresh
              </button>
            )}
          </div>
        </section>
        <div className="grid items-start gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-8 min-w-0">
          <aside className="xl:order-last xl:sticky xl:top-24 min-w-0 w-full">
            <MuscleMap exercises={statExercises} />
          </aside>

          <div className="min-w-0 space-y-4 sm:space-y-6">


            {/* Timer + live stats */}
            <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12 lg:gap-5 min-w-0">
              {mode === 'live' ? (
                <div className="rounded-2xl bg-[#111] p-5 text-white sm:p-6 lg:col-span-5 xl:col-span-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-400">Workout time</p>
                    <span className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                      <span
                        className={`h-2 w-2 rounded-full ${isTimerRunning ? 'animate-pulse bg-[#FF4A00]' : 'bg-zinc-600'
                          }`}
                      />
                      {isTimerRunning ? 'Running' : elapsedSeconds > 0 ? 'Paused' : 'Not started'}
                    </span>
                  </div>

                  <p className="mt-2 font-mono text-5xl font-black tabular-nums tracking-tight sm:text-6xl">
                    {formatDuration(elapsedSeconds)}
                  </p>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => {
                        setConfirmReset(false);
                        setIsTimerRunning((r) => !r);
                      }}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black uppercase tracking-wider transition active:scale-95 ${isTimerRunning
                        ? 'bg-white text-[#111] hover:bg-zinc-200'
                        : 'bg-[#FF4A00] text-white hover:bg-[#e04000]'
                        }`}
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="h-4 w-4 fill-current" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 fill-current" />
                          {elapsedSeconds > 0 ? 'Resume' : 'Start'}
                        </>
                      )}
                    </button>

                    {elapsedSeconds > 0 &&
                      (confirmReset ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleResetTimer}
                            className="rounded-full bg-red-600 px-4 py-3.5 text-xs font-black uppercase tracking-wider transition hover:bg-red-700 active:scale-95"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => setConfirmReset(false)}
                            className="rounded-full px-3 py-3.5 text-xs font-bold text-zinc-300 transition hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmReset(true)}
                          aria-label="Reset timer"
                          className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3.5 text-xs font-bold transition hover:bg-white/10 active:scale-95"
                        >
                          <RotateCcw className="h-4 w-4 text-[#FF4A00]" />
                          Reset
                        </button>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#111] p-5 text-white sm:p-6 lg:col-span-5 xl:col-span-4">
                  <p className="text-xs font-semibold text-zinc-400">When did you train?</p>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="space-y-1 text-xs font-semibold text-zinc-400">
                      Date
                      <input
                        type="date"
                        value={pastDate}
                        max={todayLocal}
                        onChange={(e) => setPastDate(e.target.value)}
                        className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm font-bold text-white [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-[#FF4A00]"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-zinc-400">
                      Start time
                      <input
                        type="time"
                        value={pastTime}
                        onChange={(e) => setPastTime(e.target.value)}
                        className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm font-bold text-white [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-[#FF4A00]"
                      />
                    </label>
                  </div>

                  <label className="mt-3 block space-y-1 text-xs font-semibold text-zinc-400">
                    How long did it take? (minutes)
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={600}
                      value={pastDurationMin || ''}
                      onChange={(e) => setPastMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full rounded-xl bg-white/10 px-3 py-2.5 font-mono text-lg font-black text-white focus:outline-none focus:ring-1 focus:ring-[#FF4A00]"
                    />
                  </label>

                  <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                    {pastMinutes === null
                      ? 'Estimated from your sets. Change it if you remember how long it took.'
                      : 'Calories are calculated from this duration.'}
                  </p>
                  {pastInFuture && (
                    <p className="mt-2 text-xs font-bold text-red-400">Pick a date and time in the past.</p>
                  )}
                </div>
              )}

              <dl className="grid grid-cols-3 divide-x divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 lg:col-span-7 xl:col-span-8 min-w-0">
                {liveStats.map((s) => (
                  <div key={s.label} className="flex flex-col justify-center px-2 py-3 sm:px-6 sm:py-4 min-w-0">
                    <dt className="truncate text-[10px] sm:text-xs md:text-sm font-medium text-zinc-500">{s.label}</dt>
                    <dd
                      className={`mt-1 truncate font-mono text-base font-black tracking-tight sm:text-2xl md:text-3xl ${s.color}`}
                    >
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Empty state with templates */}
            {exercises.length === 0 ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center sm:py-16">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-50 text-[#FF4A00]">
                    <Dumbbell className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 text-xl font-black uppercase tracking-tight sm:text-2xl">
                    Add your first exercise
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
                    Log your sets and reps as you go. Your weight lifted and calories update live.
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#111] px-7 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#2a2a2a] active:scale-95"
                  >
                    <Plus className="h-4 w-4 text-[#FF4A00]" />
                    Add exercise
                  </button>
                </div>

                {templates.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-lg font-black uppercase tracking-tight sm:text-xl">
                      Start from a template
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {templates.map((tpl) => (
                        <div
                          key={tpl._id || tpl.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 p-4 sm:p-5 hover:border-zinc-900 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-100 text-[#FF4A00]">
                                {tpl.category || 'Routine'}
                              </span>
                            </div>
                            <p className="truncate font-black uppercase tracking-tight text-sm text-zinc-900">{tpl.name}</p>
                            <p className="truncate text-xs text-zinc-500 mt-0.5">
                              {tpl.exercises?.length || 0} movements &middot;{' '}
                              {tpl.exercises
                                ?.slice(0, 2)
                                .map((e: any) => e.name)
                                .join(', ')}
                              {(tpl.exercises?.length || 0) > 2 ? '…' : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              onClick={() => handleDeleteTemplate(tpl._id || tpl.id)}
                              aria-label={`Delete template ${tpl.name}`}
                              className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStartTemplate(tpl)}
                              className="rounded-full bg-[#FF4A00] px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#e04000] active:scale-95 shadow-sm"
                            >
                              Use
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black uppercase tracking-tight sm:text-xl">
                    Exercises <span className="text-zinc-400">({exercises.length})</span>
                  </h2>
                  <button
                    onClick={handleSaveTemplate}
                    className="flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-800 transition hover:border-zinc-900 active:scale-95"
                  >
                    <BookmarkPlus className="h-4 w-4 text-[#FF4A00]" />
                    Save as template
                  </button>
                </div>

                <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                  {exercises.map((exercise, exIdx) => {
                    const doneCount = exercise.sets.filter((s) => s.completed).length;
                    const progress = exercise.sets.length ? (doneCount / exercise.sets.length) * 100 : 0;
                    const prevSets = history[nameKey(exercise.name)]?.last || [];
                    const showNote = !!exercise.note || notesOpen[exercise.id];

                    return (
                      <article
                        key={exercise.id}
                        className="rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-6 min-w-0 overflow-hidden"
                      >
                        {/* Exercise header */}
                        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                            <span className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF4A00]">
                              <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5" />
                            </span>
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-black uppercase tracking-tight sm:text-lg">
                                {exercise.name}
                              </h3>
                              <p className="truncate text-[11px] font-medium text-zinc-500 sm:text-xs">
                                {exercise.isCompound ? 'Compound' : 'Accessory'} &middot; {doneCount}/
                                {exercise.sets.length} sets
                                {exercise.supersetWithNext && (
                                  <span className="font-bold text-[#FF4A00]"> &middot; Superset</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Overflow menu */}
                          <div className="relative shrink-0">
                            <button
                              onClick={() => setMenuOpenId(menuOpenId === exercise.id ? null : exercise.id)}
                              aria-label={`Options for ${exercise.name}`}
                              aria-expanded={menuOpenId === exercise.id}
                              className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                            >
                              <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>

                            {menuOpenId === exercise.id && (
                              <>
                                <button
                                  aria-label="Close menu"
                                  className="fixed inset-0 z-30 cursor-default"
                                  onClick={() => setMenuOpenId(null)}
                                />
                                <div
                                  role="menu"
                                  className="absolute right-0 z-40 mt-1 w-56 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]"
                                >
                                  <MenuItem
                                    icon={<ArrowUp className="h-4 w-4" />}
                                    label="Move up"
                                    disabled={exIdx === 0}
                                    onClick={() => {
                                      handleMoveExercise(exIdx, -1);
                                      setMenuOpenId(null);
                                    }}
                                  />
                                  <MenuItem
                                    icon={<ArrowDown className="h-4 w-4" />}
                                    label="Move down"
                                    disabled={exIdx === exercises.length - 1}
                                    onClick={() => {
                                      handleMoveExercise(exIdx, 1);
                                      setMenuOpenId(null);
                                    }}
                                  />
                                  <MenuItem
                                    icon={<RefreshCw className="h-4 w-4" />}
                                    label="Replace exercise"
                                    onClick={() => {
                                      setSwapIndex(exIdx);
                                      setIsAddModalOpen(true);
                                      setMenuOpenId(null);
                                    }}
                                  />
                                  <MenuItem
                                    icon={<Link2 className="h-4 w-4" />}
                                    label={
                                      exercise.supersetWithNext ? 'Unlink superset' : 'Superset with next'
                                    }
                                    disabled={exIdx === exercises.length - 1}
                                    onClick={() => {
                                      updateExercise(exIdx, (ex) => ({
                                        ...ex,
                                        supersetWithNext: !ex.supersetWithNext,
                                      }));
                                      setMenuOpenId(null);
                                    }}
                                  />
                                  <MenuItem
                                    icon={<StickyNote className="h-4 w-4" />}
                                    label={exercise.note ? 'Edit note' : 'Add note'}
                                    onClick={() => {
                                      setNotesOpen((n) => ({ ...n, [exercise.id]: true }));
                                      setMenuOpenId(null);
                                    }}
                                  />
                                  <div className="my-1 h-px bg-zinc-100" />
                                  <MenuItem
                                    icon={<Trash2 className="h-4 w-4" />}
                                    label="Remove exercise"
                                    danger
                                    onClick={() => {
                                      handleDeleteExercise(exercise.id);
                                      setMenuOpenId(null);
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 sm:mt-4 h-1 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-[#FF4A00] transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* Note */}
                        {showNote && (
                          <input
                            type="text"
                            value={exercise.note || ''}
                            autoFocus={!exercise.note}
                            onChange={(e) =>
                              updateExercise(exIdx, (ex) => ({ ...ex, note: e.target.value }))
                            }
                            placeholder="Add a note, e.g. left shoulder tight"
                            className="mt-3 w-full rounded-xl bg-zinc-50 px-3 py-2 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                          />
                        )}

                        {/* Sets */}
                        <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                          <div
                            className={`${SET_GRID} px-1 sm:px-2 text-center text-[10px] sm:text-[11px] font-semibold text-zinc-500`}
                          >
                            <span>Set</span>
                            <span className="hidden text-left sm:block">Last time</span>
                            <span>kg</span>
                            <span>Reps</span>
                            <span />
                            <span />
                          </div>

                          {exercise.sets.map((set, setIdx) => {
                            const prev = prevSets.length
                              ? prevSets[Math.min(setIdx, prevSets.length - 1)]
                              : undefined;
                            const isActive = activeSet?.ex === exercise.id && activeSet.set === setIdx;
                            const pr = isNewBest(exercise.name, set);

                            return (
                              <div
                                key={setIdx}
                                className={`rounded-xl sm:rounded-2xl p-1.5 sm:p-2 transition-colors ${set.completed ? 'bg-emerald-50' : 'bg-zinc-50'
                                  }`}
                              >
                                <div className={SET_GRID}>
                                  {/* Set number (tap to mark warm-up) */}
                                  <button
                                    onClick={() => handleToggleWarmup(exIdx, setIdx)}
                                    title={set.isWarmup ? 'Warm-up set (tap to change)' : 'Tap to mark as warm-up'}
                                    aria-label={
                                      set.isWarmup
                                        ? `Set ${set.setNumber} is a warm-up. Tap to make it a working set`
                                        : `Set ${set.setNumber}. Tap to mark as warm-up`
                                    }
                                    className={`grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full font-mono text-[11px] sm:text-xs font-black transition ${set.isWarmup
                                      ? 'bg-amber-100 text-amber-700'
                                      : set.completed
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                                      }`}
                                  >
                                    {set.isWarmup ? 'W' : set.setNumber}
                                  </button>

                                  {/* Last time (tap to fill) */}
                                  {prev ? (
                                    <button
                                      onClick={() => {
                                        handleUpdateSet(exIdx, setIdx, 'weightKg', prev.weightKg);
                                        handleUpdateSet(exIdx, setIdx, 'reps', prev.reps);
                                      }}
                                      title="Tap to use these numbers"
                                      className="hidden truncate text-left text-xs text-zinc-500 underline decoration-zinc-300 decoration-dotted underline-offset-4 transition hover:text-[#FF4A00] sm:block"
                                    >
                                      {prev.weightKg}kg × {prev.reps}
                                    </button>
                                  ) : (
                                    <span className="hidden text-xs text-zinc-300 sm:block">—</span>
                                  )}

                                  <input
                                    id={`kg-${exercise.id}-${setIdx}`}
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="600"
                                    inputMode="decimal"
                                    aria-label={`Set ${set.setNumber} weight in kg`}
                                    value={set.weightKg === 0 ? '' : set.weightKg}
                                    onFocus={() => setActiveSet({ ex: exercise.id, set: setIdx })}
                                    onChange={(e) =>
                                      handleUpdateSet(exIdx, setIdx, 'weightKg', parseFloat(e.target.value) || 0)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        focusField(`reps-${exercise.id}-${setIdx}`);
                                      }
                                    }}
                                    className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white py-2 sm:py-2.5 px-1 sm:px-2 text-center font-mono text-sm sm:text-base font-bold text-zinc-900 focus:border-zinc-900 focus:outline-none"
                                    placeholder="0"
                                  />

                                  <input
                                    id={`reps-${exercise.id}-${setIdx}`}
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    inputMode="numeric"
                                    aria-label={`Set ${set.setNumber} reps`}
                                    value={set.reps === 0 ? '' : set.reps}
                                    onFocus={() => setActiveSet({ ex: exercise.id, set: setIdx })}
                                    onChange={(e) =>
                                      handleUpdateSet(exIdx, setIdx, 'reps', parseInt(e.target.value, 10) || 0)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (!set.completed) handleToggleComplete(exIdx, setIdx);
                                        (e.target as HTMLInputElement).blur();
                                      }
                                    }}
                                    className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white py-2 sm:py-2.5 px-1 sm:px-2 text-center font-mono text-sm sm:text-base font-bold text-zinc-900 focus:border-zinc-900 focus:outline-none"
                                    placeholder="0"
                                  />

                                  <button
                                    onClick={() => handleToggleComplete(exIdx, setIdx)}
                                    aria-label={set.completed ? 'Mark set not done' : 'Mark set done'}
                                    aria-pressed={set.completed}
                                    className={`grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-full transition active:scale-90 ${set.completed
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-white text-zinc-400 ring-1 ring-zinc-200 hover:text-zinc-900 hover:ring-zinc-400'
                                      }`}
                                  >
                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
                                  </button>

                                  {exercise.sets.length > 1 ? (
                                    <button
                                      onClick={() => handleDeleteSet(exIdx, setIdx)}
                                      aria-label={`Delete set ${set.setNumber}`}
                                      className="grid h-5 w-5 sm:h-6 sm:w-6 place-items-center text-zinc-300 transition hover:text-red-500"
                                    >
                                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    </button>
                                  ) : (
                                    <span />
                                  )}
                                </div>

                                {/* Quick adjust bar for the row you're editing */}
                                {isActive && (
                                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-black/5 px-1 pt-2">
                                    <Stepper
                                      label="kg"
                                      onMinus={() => adjustSet(exIdx, setIdx, 'weightKg', -2.5)}
                                      onPlus={() => adjustSet(exIdx, setIdx, 'weightKg', 2.5)}
                                      step="2.5"
                                    />
                                    <Stepper
                                      label="reps"
                                      onMinus={() => adjustSet(exIdx, setIdx, 'reps', -1)}
                                      onPlus={() => adjustSet(exIdx, setIdx, 'reps', 1)}
                                      step="1"
                                    />
                                    {prev && (
                                      <button
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                          handleUpdateSet(exIdx, setIdx, 'weightKg', prev.weightKg);
                                          handleUpdateSet(exIdx, setIdx, 'reps', prev.reps);
                                        }}
                                        className="text-xs font-bold text-[#FF4A00] sm:hidden"
                                      >
                                        Last time: {prev.weightKg}kg × {prev.reps} · Use
                                      </button>
                                    )}
                                  </div>
                                )}

                                {pr && (
                                  <p className="mt-2 flex items-center gap-1.5 px-1 text-xs font-bold text-[#FF4A00]">
                                    <Trophy className="h-3.5 w-3.5" />
                                    New best
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => handleAddSet(exIdx)}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 py-3 text-xs font-bold text-zinc-800 transition hover:border-zinc-900 active:scale-[0.99]"
                        >
                          <Plus className="h-4 w-4 text-[#FF4A00]" />
                          Add set
                        </button>
                      </article>
                    );
                  })}

                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex min-h-[120px] items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 text-sm font-bold text-zinc-800 transition hover:border-zinc-900 active:scale-[0.99] lg:min-h-[160px]"
                  >
                    <Plus className="h-5 w-5 text-[#FF4A00]" />
                    Add exercise
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Toast (undo / new best / saved) */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div
            role="status"
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-[#111] py-2.5 pl-5 pr-2.5 text-sm font-semibold text-white shadow-2xl"
          >
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
                className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition hover:bg-white/25"
              >
                Undo
              </button>
            )}
            <button
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className="grid h-7 w-7 place-items-center rounded-full text-zinc-400 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/70 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-end px-4 py-3 sm:px-8 lg:px-12 2xl:px-16">
          <button
            onClick={() => setIsFinishModalOpen(true)}
            disabled={mode === 'past' && (pastInFuture || exercises.length === 0)}
            className="w-full sm:w-auto sm:min-w-[280px] rounded-full bg-[#FF4A00] px-8 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-orange-600/25 transition hover:bg-[#e04000] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mode === 'past' ? 'Save workout' : 'Finish workout'}
          </button>
        </div>
      </div>

      {/* Modals */}
      <WeightQuickEditModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        currentWeight={userWeightKg}
        onSaveWeight={handleSaveWeight}
      />

      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSwapIndex(null);
        }}
        onSelectExercise={(ex: any) => (swapIndex !== null ? handleSwapExercise(ex) : handleAddExercise(ex))}
      />

      <RestTimerModal
        key={restSeconds}
        isOpen={isRestTimerOpen}
        onClose={() => setIsRestTimerOpen(false)}
        defaultSeconds={restSeconds}
      />

      <FinishWorkoutModal
        isOpen={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
        workoutData={{
          title: workoutTitle,
          durationSeconds,
          totalVolumeKg: totalVolume,
          caloriesBurned: totalCalories,
          exercises,
        }}
        onSaveAndSync={handleSaveAndSync}
      />

      <SaveAsTemplateModal
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
        workoutTitle={workoutTitle}
        exercises={exercises}
        onSuccess={() => {
          fetchTemplates();
          showToast('Saved routine to database');
        }}
      />
    </div>
  );
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-[#FF4A00]" />
        </div>
      }
    >
      <ActiveWorkoutContent />
    </Suspense>
  );
}

/* ───────────────────────── Small components ───────────────────────── */

function MenuItem({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${danger
        ? 'text-red-600 hover:bg-red-50'
        : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
        }`}
    >
      <span className={danger ? '' : 'text-zinc-400'}>{icon}</span>
      {label}
    </button>
  );
}

/* −/+ buttons that keep keyboard focus in the input while you tap */
function Stepper({
  label,
  step,
  onMinus,
  onPlus,
}: {
  label: string;
  step: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-8 text-xs font-semibold text-zinc-500">{label}</span>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onMinus}
        aria-label={`Decrease ${label} by ${step}`}
        className="grid h-9 min-w-[2.75rem] place-items-center rounded-full bg-white px-2 text-xs font-bold text-zinc-800 ring-1 ring-zinc-200 transition hover:ring-zinc-900 active:scale-90"
      >
        <span className="flex items-center gap-0.5">
          <Minus className="h-3 w-3" />
          {step}
        </span>
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onPlus}
        aria-label={`Increase ${label} by ${step}`}
        className="grid h-9 min-w-[2.75rem] place-items-center rounded-full bg-white px-2 text-xs font-bold text-zinc-800 ring-1 ring-zinc-200 transition hover:ring-zinc-900 active:scale-90"
      >
        <span className="flex items-center gap-0.5">
          <Plus className="h-3 w-3" />
          {step}
        </span>
      </button>
    </div>
  );
}