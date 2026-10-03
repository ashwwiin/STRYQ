'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import VolumeChart from '@/components/VolumeChart';
import WorkoutCard from '@/components/WorkoutCard';
import WeightQuickEditModal from '@/components/WeightQuickEditModal';
import AppleHealthGuideModal from '@/components/AppleHealthGuideModal';
import CreateTemplateModal from '@/components/CreateTemplateModal';
import {
  Dumbbell,
  Plus,
  Flame,
  Zap,
  Heart,
  Activity,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  Smartphone,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Trophy,
  BookmarkPlus,
  Trash2,
  Play,
} from 'lucide-react';
import { formatNumber, calculate1RM } from '@/lib/math';

export default function DashboardPage() {
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    weightKg: number;
    stravaConnected: boolean;
  } | null>(null);

  const [workouts, setWorkouts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isHealthGuideOpen, setIsHealthGuideOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);

  // Interactive 1RM tool state
  const [calcWeight, setCalcWeight] = useState(100);
  const [calcReps, setCalcReps] = useState(5);

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

  const handleSyncToStrava = async (workout: any) => {
    try {
      const res = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId: workout._id, workoutData: workout }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to sync workout:', err);
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

  const calculated1RM = calculate1RM(calcWeight, calcReps);

  const repMaxTable = [
    { reps: '1RM (100%)', weight: Math.round(calculated1RM) },
    { reps: '3RM (93%)', weight: Math.round(calculated1RM * 0.93) },
    { reps: '5RM (87%)', weight: Math.round(calculated1RM * 0.87) },
    { reps: '8RM (80%)', weight: Math.round(calculated1RM * 0.80) },
    { reps: '10RM (75%)', weight: Math.round(calculated1RM * 0.75) },
  ];

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
    <div className="min-h-screen w-full bg-[#FFFFFF] text-[#111111] flex flex-col selection:bg-[#FF4A00] selection:text-white">
      <Header
        userWeight={user?.weightKg || 75}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
        stravaConnected={user?.stravaConnected || false}
        userName={user?.name || 'Athlete'}
      />

      <main className="flex-1 w-full px-6 sm:px-10 lg:px-16 py-8 space-y-10 max-w-[1600px] mx-auto">
        {/* Top Hero Banner */}
        <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl min-h-[440px] sm:min-h-[480px] flex items-end bg-[#111111] group">
          <Image
            src="/images/hero.jpg"
            alt="Strength Training"
            fill
            className="object-cover object-center opacity-65 group-hover:scale-105 transition-transform duration-1000 ease-out"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          <div className="relative z-10 p-8 sm:p-12 max-w-4xl space-y-4 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-1.5 rounded-full bg-[#FF4A00] text-white text-xs font-black uppercase tracking-widest shadow-md">
                STRYQ. ENGINE
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF4A00]" />
                {todayFormatted}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none uppercase">
              Heavy Sets. <br />
              <span className="text-[#FF4A00]">Zero Paywalls.</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 font-medium max-w-xl leading-relaxed">
              Unbloated, high-velocity strength tracking. Real-time Epley 1RM computation, active MET caloric burn, and automatic Strava / Apple Health sync.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/workout/active"
                className="py-4 px-9 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-sm uppercase tracking-wider flex items-center gap-3 shadow-2xl shadow-orange-600/30 hover:scale-105 active:scale-95 transition-all"
              >
                <Dumbbell className="w-5 h-5 stroke-[2.5]" />
                <span>Start Blank Session</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>

              <button
                onClick={() => setIsCreateTemplateOpen(true)}
                className="py-4 px-7 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-white/20 transition-all"
              >
                <BookmarkPlus className="w-4 h-4 text-[#FF4A00]" />
                <span>Create DB Template</span>
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Bento Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="nike-card p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Lifetime Tonnage
              </span>
              <div className="p-2 rounded-xl bg-orange-50 text-[#FF4A00]">
                <Dumbbell className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-zinc-900 font-mono tracking-tight">
              {formatNumber(totalTonnage)} <span className="text-sm font-semibold text-zinc-400 font-sans">kg</span>
            </p>
            <p className="text-[11px] text-zinc-400 font-semibold">Sum of weight &times; completed reps</p>
          </div>

          <div className="nike-card p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF4A00]">
                Active MET Burn
              </span>
              <div className="p-2 rounded-xl bg-orange-100 text-[#FF4A00]">
                <Flame className="w-4 h-4 fill-[#FF4A00]" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-[#FF4A00] font-mono tracking-tight">
              ~{formatNumber(totalCalories)} <span className="text-sm font-semibold text-zinc-400 font-sans">kcal</span>
            </p>
            <p className="text-[11px] text-zinc-400 font-semibold">Metabolic energy expenditure</p>
          </div>

          <div className="nike-card p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Logged Workouts
              </span>
              <div className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-zinc-900 font-mono tracking-tight">
              {totalSessions} <span className="text-sm font-semibold text-zinc-400 font-sans">sessions</span>
            </p>
            <p className="text-[11px] text-zinc-400 font-semibold">Recorded in database</p>
          </div>

          <div className="nike-card p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Saved Templates
              </span>
              <div className="p-2 rounded-xl bg-orange-50 text-[#FF4A00]">
                <BookmarkPlus className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-zinc-900 font-mono tracking-tight">
              {templates.length} <span className="text-sm font-semibold text-zinc-400 font-sans">routines</span>
            </p>
            <p className="text-[11px] text-zinc-400 font-semibold">Stored in MongoDB Atlas</p>
          </div>
        </div>

        {/* WORKOUT TEMPLATES SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2.5">
                <BookmarkPlus className="w-6 h-6 text-[#FF4A00]" />
                <span>Workout Routines & Templates (Saved to DB)</span>
              </h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                One-tap split routines stored in your MongoDB database
              </p>
            </div>

            <button
              onClick={() => setIsCreateTemplateOpen(true)}
              className="py-2.5 px-5 rounded-full bg-[#111111] hover:bg-[#222222] text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-4 h-4 text-[#FF4A00]" />
              <span>+ New Template</span>
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
                        title="Delete Template from DB"
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
                  No Custom Templates in Database Yet
                </h3>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  Save starter routines to your database with one click, or build your own custom split.
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
                      <span>Save Routine to DB</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Volume Progression Chart & Logs */}
          <div className="lg:col-span-8 space-y-8">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#FF4A00]" />
                  <span>Weekly Progression</span>
                </h2>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Past 7 Days</span>
              </div>
              <VolumeChart workouts={workouts} />
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#FF4A00]" />
                  <span>Workout History</span>
                </h2>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {workouts.length} recorded
                </span>
              </div>

              <div className="space-y-4">
                {workouts.map((workout) => (
                  <WorkoutCard
                    key={workout._id}
                    workout={workout}
                    onSyncStrava={handleSyncToStrava}
                    onDelete={handleDeleteWorkout}
                  />
                ))}

                {workouts.length === 0 && !loading && (
                  <div className="nike-card p-8 sm:p-10 space-y-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF4A00] flex items-center justify-center mx-auto">
                      <Dumbbell className="w-8 h-8 stroke-[2.5]" />
                    </div>

                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">
                        Ready for Your First Session?
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed">
                        Start an active workout session or launch a routine template from above to record sets and tonnage into MongoDB.
                      </p>
                    </div>

                    <div className="pt-2">
                      <Link
                        href="/workout/active"
                        className="inline-flex items-center gap-2.5 py-4 px-8 rounded-full bg-[#111111] hover:bg-[#222222] text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4 text-[#FF4A00]" />
                        <span>Start First Workout</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column (4 cols): Quick Tools & Telemetry */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick 1RM Interactive Estimator */}
            <div className="nike-card p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-orange-50 text-[#FF4A00]">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 uppercase">1RM Calculator</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">Epley Formula</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#FF4A00] bg-orange-50 px-2.5 py-1 rounded-full uppercase">
                  Interactive
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-black text-[#FF4A00] font-mono text-center focus:outline-none focus:border-zinc-900 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Reps Done
                  </label>
                  <input
                    type="number"
                    value={calcReps}
                    onChange={(e) => setCalcReps(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-black text-zinc-900 font-mono text-center focus:outline-none focus:border-zinc-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-center space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                  Estimated 1-Rep Max
                </span>
                <p className="text-4xl font-black text-[#FF4A00] font-mono tracking-tight">
                  {calculated1RM} <span className="text-sm font-normal text-zinc-500 font-sans">kg</span>
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Training Percentages
                </span>
                <div className="grid grid-cols-5 gap-1 text-center">
                  {repMaxTable.map((item, idx) => (
                    <div key={idx} className="bg-zinc-50 rounded-xl p-2 border border-zinc-100">
                      <span className="text-[9px] font-bold text-zinc-400 block">{item.reps.split(' ')[0]}</span>
                      <span className="text-xs font-black text-zinc-800 font-mono">{item.weight}kg</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Apple Health Card */}
            <div
              onClick={() => setIsHealthGuideOpen(true)}
              className="nike-card p-6 sm:p-7 hover:border-red-300 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-red-50 text-red-500">
                  <Heart className="w-6 h-6 fill-red-500/20" />
                </div>
                <span className="text-xs font-black text-[#FF4A00] uppercase tracking-wider group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Setup guide &rarr;
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-base text-zinc-900 uppercase">Apple Health Sync</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  STRYQ writes duration and active MET calories directly into iOS HealthKit through Strava to close your daily Move and Exercise rings.
                </p>
              </div>
            </div>
          </div>
        </div>
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

      <AppleHealthGuideModal
        isOpen={isHealthGuideOpen}
        onClose={() => setIsHealthGuideOpen(false)}
      />
    </div>
  );
}