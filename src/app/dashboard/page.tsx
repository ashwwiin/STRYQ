'use client';

import React, { useEffect, useState } from 'react';
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
  TrendingUp,
  Calendar as CalendarIcon,
  Trophy,
  BookmarkPlus,
  Trash2,
  Play,
  Layers,
} from 'lucide-react';
import { formatNumber } from '@/lib/math';

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

  const fetchData = async () => {
    try {
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
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveWeight = async (newWeight: number) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightKg: newWeight }),
      });

      if (res.ok) {
        setUser((prev) => (prev ? { ...prev, weightKg: newWeight } : null));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      await fetch(`/api/workouts/${workoutId}`, { method: 'DELETE' });
      setWorkouts((prev) => prev.filter((w) => w._id !== workoutId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await fetch(`/api/templates/${templateId}`, { method: 'DELETE' });
      setTemplates((prev) => prev.filter((t) => t._id !== templateId));
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

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

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

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] text-[#111111] flex flex-col selection:bg-[#FF4A00] selection:text-white pb-24">
      <Header
        userWeight={user?.weightKg || 75}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
        userName={user?.name || 'Athlete'}
      />

      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 2xl:px-16 py-8 space-y-10 max-w-[1920px] mx-auto">
        {/* Top Hero Banner */}
        <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl min-h-[420px] sm:min-h-[480px] lg:min-h-[520px] xl:min-h-[560px] flex items-center bg-[#09090b] group">
          <Image
            src="/images/hero.jpg"
            alt="Strength Training"
            fill
            className="object-cover object-[55%_12%] sm:object-[center_12%] lg:object-[65%_15%] opacity-75 sm:opacity-80 group-hover:scale-105 transition-transform duration-1000 ease-out"
            priority
          />
          {/* Multi-angle gradients for readability and subject clarity */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 via-40% to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

          <div className="relative z-10 p-6 sm:p-10 lg:p-14 max-w-2xl space-y-4 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-[#FF4A00] text-white text-[11px] sm:text-xs font-black uppercase tracking-widest shadow-md">
                STRYQ. ENGINE
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <CalendarIcon className="w-3.5 h-3.5 text-[#FF4A00]" />
                {todayFormatted}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight uppercase">
              Heavy Sets. <br />
              <span className="text-[#FF4A00]">Complete Logs.</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 font-medium max-w-xl leading-relaxed">
              Track your strength progression, log set-by-set tonnage, and execute split routines with real-time Epley math.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href="/workout/active"
                className="py-3.5 sm:py-4 px-7 sm:px-9 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-2xl shadow-orange-600/30 hover:scale-105 active:scale-95 transition-all"
              >
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span>Start Session</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>

              <Link
                href="/calendar"
                className="py-3.5 sm:py-4 px-6 sm:px-7 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-white/20 transition-all active:scale-95"
              >
                <CalendarIcon className="w-4 h-4 text-[#FF4A00]" />
                <span>Open Calendar</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Telemetry Bento Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="nike-card p-5 sm:p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                Lifetime Tonnage
              </span>
              <div className="p-2 rounded-xl bg-orange-50 text-[#FF4A00]">
                <Dumbbell className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-4xl font-black text-zinc-900 font-mono tracking-tight">
              {formatNumber(totalTonnage)} <span className="text-xs sm:text-sm font-semibold text-zinc-400 font-sans">kg</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-semibold">Sum of weight &times; completed reps</p>
          </div>

          <div className="nike-card p-5 sm:p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#FF4A00]">
                Active MET Burn
              </span>
              <div className="p-2 rounded-xl bg-orange-100 text-[#FF4A00]">
                <Flame className="w-4 h-4 fill-[#FF4A00]" />
              </div>
            </div>
            <p className="text-2xl sm:text-4xl font-black text-[#FF4A00] font-mono tracking-tight">
              ~{formatNumber(totalCalories)} <span className="text-xs sm:text-sm font-semibold text-zinc-400 font-sans">kcal</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-semibold">Metabolic energy expenditure</p>
          </div>

          <div className="nike-card p-5 sm:p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                Logged Workouts
              </span>
              <div className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-4xl font-black text-zinc-900 font-mono tracking-tight">
              {totalSessions} <span className="text-xs sm:text-sm font-semibold text-zinc-400 font-sans">sessions</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-semibold">Recorded in database</p>
          </div>

          <div className="nike-card p-5 sm:p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                Saved Templates
              </span>
              <div className="p-2 rounded-xl bg-orange-50 text-[#FF4A00]">
                <BookmarkPlus className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-4xl font-black text-zinc-900 font-mono tracking-tight">
              {templates.length} <span className="text-xs sm:text-sm font-semibold text-zinc-400 font-sans">routines</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-semibold">Stored in database</p>
          </div>
        </div>

        {/* RECENT WORKOUTS & VOLUME PROGRESSION */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-[#FF4A00]" />
                <span>Recent Training Sessions</span>
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Your latest completed workouts and progression log
              </p>
            </div>

            <Link
              href="/calendar"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#FF4A00] bg-orange-50 hover:bg-orange-100 rounded-full transition-colors self-start sm:self-auto"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Open Calendar View &rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Recent Workouts List */}
            <div className="lg:col-span-8 space-y-4">
              {workouts.slice(0, 5).map((workout) => (
                <WorkoutCard
                  key={workout._id}
                  workout={workout}
                  onDelete={handleDeleteWorkout}
                />
              ))}

              {workouts.length > 5 && (
                <div className="text-center pt-2">
                  <Link
                    href="/calendar"
                    className="inline-flex items-center gap-2 py-2.5 px-6 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    <span>View all {workouts.length} workouts on Calendar</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF4A00]" />
                  </Link>
                </div>
              )}

              {workouts.length === 0 && !loading && (
                <div className="nike-card p-8 sm:p-10 space-y-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF4A00] flex items-center justify-center mx-auto">
                    <Dumbbell className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">
                      No Workouts Logged Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 font-medium">
                      Start your first training session or pick a split routine below.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/workout/active"
                      className="inline-flex items-center gap-2 py-3.5 px-8 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Start First Workout</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Volume Progression Chart */}
            <div className="lg:col-span-4 space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#FF4A00]" />
                    <span>Volume Progression</span>
                  </h3>
                </div>
                <VolumeChart workouts={workouts} />
              </section>
            </div>
          </div>
        </section>

        {/* WORKOUT TEMPLATES & ROUTINES SECTION */}
        <section className="space-y-4 pt-4 border-t border-zinc-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2.5">
                <BookmarkPlus className="w-6 h-6 text-[#FF4A00]" />
                <span>Workout Routines &amp; Templates</span>
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Launch preset or custom split routines directly into active training
              </p>
            </div>

            <button
              onClick={() => setIsCreateTemplateOpen(true)}
              className="py-2.5 px-5 rounded-full bg-[#111111] hover:bg-[#222222] text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-4 h-4 text-[#FF4A00]" />
              <span>+ New Routine</span>
            </button>
          </div>

          {/* User's Templates Grid */}
          {templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {templates.map((tpl) => (
                <div
                  key={tpl._id}
                  className="nike-card p-6 flex flex-col justify-between space-y-4 hover:border-zinc-900 transition-all shadow-sm group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-[#FF4A00] border border-orange-100">
                        {tpl.category || 'Custom Split'}
                      </span>
                      <button
                        onClick={() => handleDeleteTemplate(tpl._id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">{tpl.name}</h3>
                      {tpl.notes && <p className="text-xs text-zinc-500 line-clamp-2 mt-1 font-medium">{tpl.notes}</p>}
                    </div>

                    {/* Exercises Summary */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {tpl.exercises?.length || 0} Movements:
                      </span>
                      <div className="space-y-1">
                        {tpl.exercises?.slice(0, 4).map((ex: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-zinc-700">
                            <span className="font-semibold truncate max-w-[180px]">{ex.name}</span>
                            <span className="text-zinc-400 font-mono text-[11px]">
                              {ex.defaultSets} &times; {ex.defaultWeightKg}kg
                            </span>
                          </div>
                        ))}
                        {tpl.exercises?.length > 4 && (
                          <p className="text-[10px] text-zinc-400 font-medium">
                            +{tpl.exercises.length - 4} more movements
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/workout/active?templateId=${tpl._id}`}
                    className="w-full py-3.5 px-6 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 active:scale-95 transition-all mt-3"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start This Workout</span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="nike-card p-8 sm:p-10 space-y-6">
              <div className="max-w-xl space-y-1">
                <h3 className="text-lg font-black uppercase text-zinc-900">
                  Ready-to-Use Training Splits
                </h3>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  Save starter routines with one click, or build your own custom split.
                </p>
              </div>

              {/* Starter routines ready to save */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {starterTemplates.map((starter, idx) => (
                  <div key={idx} className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200 space-y-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-[#FF4A00]">
                      {starter.category}
                    </span>
                    <h4 className="font-black text-sm text-zinc-900 uppercase">{starter.name}</h4>
                    <p className="text-xs text-zinc-500 line-clamp-2">{starter.notes}</p>
                    <button
                      onClick={() => handleSaveStarterTemplate(starter)}
                      className="w-full py-2.5 rounded-full bg-white border border-zinc-300 hover:border-zinc-900 text-zinc-900 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 text-[#FF4A00]" />
                      <span>Save Routine to App</span>
                    </button>
                  </div>
                ))}
              </div>
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