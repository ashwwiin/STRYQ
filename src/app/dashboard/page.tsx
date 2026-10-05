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
    weekday: 'short',
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

      <main className="flex-1 w-full px-3.5 sm:px-8 lg:px-12 2xl:px-16 py-4 sm:py-8 space-y-6 sm:space-y-8 max-w-[1920px] mx-auto">
        {/* Top Hero Banner */}
        <div className="w-full relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl min-h-[300px] sm:min-h-[420px] lg:min-h-[500px] flex items-end sm:items-center bg-[#09090b] group">
          <Image
            src="/images/hero.jpg"
            alt="Strength Training"
            fill
            className="object-cover object-[55%_10%] sm:object-[center_12%] lg:object-[65%_15%] opacity-75 sm:opacity-80 group-hover:scale-105 transition-transform duration-1000 ease-out"
            priority
          />
          {/* Multi-angle gradients for readability and subject clarity */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 via-40% to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/30 sm:hidden" />

          <div className="relative z-10 p-5 sm:p-8 lg:p-12 max-w-2xl space-y-3 sm:space-y-4 text-white">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="px-3 py-1 rounded-full bg-[#FF4A00] text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-md">
                STRYQ. ENGINE
              </span>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
                <CalendarIcon className="w-3 h-3 text-[#FF4A00]" />
                {todayFormatted}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight uppercase">
              Heavy Sets. <br />
              <span className="text-[#FF4A00]">Complete Logs.</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-lg leading-relaxed line-clamp-2 sm:line-clamp-none">
              Track strength progression, log set-by-set tonnage, and execute split routines with real-time Epley math.
            </p>

            <div className="pt-1 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3.5">
              <Link
                href="/workout/active"
                className="py-3 px-4 sm:px-7 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-600/30 active:scale-95 transition-all text-center"
              >
                <Dumbbell className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span className="truncate">Start Session</span>
              </Link>

              <Link
                href="/calendar"
                className="py-3 px-4 sm:px-6 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/20 transition-all active:scale-95 text-center"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-[#FF4A00] shrink-0" />
                <span className="truncate">Calendar</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Telemetry Bento Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="nike-card p-3.5 sm:p-5 space-y-1 sm:space-y-1.5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 truncate">
                Lifetime Tonnage
              </span>
              <div className="p-1.5 rounded-lg bg-orange-50 text-[#FF4A00] shrink-0">
                <Dumbbell className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-black text-zinc-900 font-mono tracking-tight">
              {formatNumber(totalTonnage)} <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 font-sans">kg</span>
            </p>
            <p className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold truncate hidden sm:block">Sum of weight &times; completed reps</p>
          </div>

          <div className="nike-card p-3.5 sm:p-5 space-y-1 sm:space-y-1.5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#FF4A00] truncate">
                Active MET Burn
              </span>
              <div className="p-1.5 rounded-lg bg-orange-100 text-[#FF4A00] shrink-0">
                <Flame className="w-3.5 h-3.5 fill-[#FF4A00]" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-black text-[#FF4A00] font-mono tracking-tight">
              ~{formatNumber(totalCalories)} <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 font-sans">kcal</span>
            </p>
            <p className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold truncate hidden sm:block">Metabolic energy expenditure</p>
          </div>

          <div className="nike-card p-3.5 sm:p-5 space-y-1 sm:space-y-1.5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 truncate">
                Logged Sessions
              </span>
              <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-800 shrink-0">
                <Trophy className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-black text-zinc-900 font-mono tracking-tight">
              {totalSessions} <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 font-sans">logs</span>
            </p>
            <p className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold truncate hidden sm:block">Recorded in database</p>
          </div>

          <div className="nike-card p-3.5 sm:p-5 space-y-1 sm:space-y-1.5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 truncate">
                Saved Splits
              </span>
              <div className="p-1.5 rounded-lg bg-orange-50 text-[#FF4A00] shrink-0">
                <BookmarkPlus className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-black text-zinc-900 font-mono tracking-tight">
              {templates.length} <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 font-sans">routines</span>
            </p>
            <p className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold truncate hidden sm:block">Stored in database</p>
          </div>
        </div>

        {/* RECENT WORKOUTS & VOLUME PROGRESSION */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2 truncate">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF4A00] shrink-0" />
                <span>Recent Training</span>
              </h2>
            </div>

            <Link
              href="/calendar"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#FF4A00] bg-orange-50 hover:bg-orange-100 rounded-full transition-colors shrink-0"
            >
              <CalendarIcon className="w-3 h-3" />
              <span>Full Calendar &rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
            {/* Left: Recent Workouts List */}
            <div className="lg:col-span-8 space-y-3 sm:space-y-4">
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
                    className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    <span>View all {workouts.length} workouts on Calendar</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF4A00]" />
                  </Link>
                </div>
              )}

              {workouts.length === 0 && !loading && (
                <div className="nike-card p-6 sm:p-10 space-y-4 text-center">
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
                  <div className="pt-1">
                    <Link
                      href="/workout/active"
                      className="inline-flex items-center gap-1.5 py-3 px-6 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Start First Workout</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Volume Progression Chart */}
            <div className="lg:col-span-4 space-y-4">
              <VolumeChart workouts={workouts} />
            </div>
          </div>
        </section>

        {/* WORKOUT TEMPLATES & ROUTINES SECTION */}
        <section className="space-y-4 sm:space-y-5 pt-4 sm:pt-6 border-t border-zinc-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-orange-50 text-[#FF4A00] shrink-0">
                <BookmarkPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-black text-zinc-900 tracking-tight uppercase truncate">
                  Splits &amp; Routines
                </h2>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-medium truncate hidden sm:block">
                  Launch pre-built splits or build your custom routines
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateTemplateOpen(true)}
              className="py-2 px-3.5 sm:py-2.5 sm:px-5 rounded-full bg-[#111111] hover:bg-[#222222] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF4A00]" />
              <span>New Split</span>
            </button>
          </div>

          {/* User's Custom Templates Grid */}
          {templates.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Your Saved Routines ({templates.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                {templates.map((tpl) => (
                  <div
                    key={tpl._id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 hover:border-zinc-900 flex flex-col justify-between space-y-3 sm:space-y-4 transition-all shadow-sm group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-orange-50 text-[#FF4A00] border border-orange-100">
                          {tpl.category || 'Custom Split'}
                        </span>
                        <button
                          onClick={() => handleDeleteTemplate(tpl._id)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Routine"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

                      {/* Exercises Preview */}
                      <div className="space-y-1 pt-1.5 border-t border-zinc-100">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          {tpl.exercises?.length || 0} Movements
                        </span>
                        <div className="space-y-0.5">
                          {tpl.exercises?.slice(0, 3).map((ex: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-zinc-700">
                              <span className="font-semibold truncate max-w-[170px]">{ex.name}</span>
                              <span className="text-zinc-400 font-mono text-[10px]">
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
                      className="w-full py-2.5 px-4 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 active:scale-95 transition-all mt-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Start Workout</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preset Starter Split Routines */}
          <div className="space-y-2.5 pt-1">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-400">
              {templates.length > 0 ? 'Explore Preset Splits' : 'Ready-to-Use Training Splits'}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {starterTemplates.map((starter, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-50/70 hover:bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 hover:border-zinc-400 flex flex-col justify-between space-y-3 transition-all shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-orange-100/70 text-[#FF4A00]">
                        {starter.category}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase">
                        {starter.exercises.length} moves
                      </span>
                    </div>

                    <h4 className="font-black text-xs sm:text-sm text-zinc-900 uppercase tracking-tight">
                      {starter.name}
                    </h4>

                    <p className="text-[11px] sm:text-xs text-zinc-500 line-clamp-2 font-medium">
                      {starter.notes}
                    </p>

                    {/* Preview exercises list */}
                    <div className="space-y-0.5 pt-1 border-t border-zinc-200/60">
                      {starter.exercises.slice(0, 2).map((ex, exIdx) => (
                        <div key={exIdx} className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-600">
                          <span className="font-medium truncate max-w-[160px]">{ex.name}</span>
                          <span className="font-mono text-zinc-400 text-[10px]">{ex.defaultSets} &times; {ex.defaultWeightKg}kg</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => handleSaveStarterTemplate(starter)}
                      className="w-full py-2 px-3.5 rounded-full bg-white hover:bg-zinc-900 hover:text-white border border-zinc-300 hover:border-zinc-900 text-zinc-900 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 text-[#FF4A00]" />
                      <span>Save Split Routine</span>
                    </button>
                  </div>
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