'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import WorkoutCalendar from '@/components/WorkoutCalendar';
import DayWorkoutDetail from '@/components/DayWorkoutDetail';
import WeightQuickEditModal from '@/components/WeightQuickEditModal';
import { Dumbbell } from 'lucide-react';
import { getOfflineWorkoutQueue, getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/storage';

const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

export default function CalendarPage() {
  const [user, setUser] = useState<{
    id?: string;
    name: string;
    email?: string;
    weightKg: number;
  } | null>(null);

  useIsoLayoutEffect(() => {
    const cached = getCachedUser();
    if (cached) setUser(cached);
    try {
      const cachedWorkouts = localStorage.getItem('stryq_calendar_workouts_cache');
      const offline = getOfflineWorkoutQueue();
      if (cachedWorkouts) {
        const parsed = JSON.parse(cachedWorkouts);
        setWorkouts([...offline, ...parsed]);
      } else if (offline.length > 0) {
        setWorkouts(offline);
      }
    } catch {}
  }, []);

  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [userRes, workoutsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/workouts'),
      ]);

      if (userRes.status === 401) {
        clearCachedUser();
        window.location.href = '/login';
        return;
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user) {
          setUser(userData.user);
          saveCachedUser(userData.user);
        }
      }

      let remoteWorkouts: any[] = [];
      if (workoutsRes.ok) {
        const wData = await workoutsRes.json();
        remoteWorkouts = wData.workouts || [];
        try {
          localStorage.setItem('stryq_calendar_workouts_cache', JSON.stringify(remoteWorkouts));
        } catch {}
      }

      // Merge remote workouts with any offline logged workouts
      const offline = getOfflineWorkoutQueue();
      const allWorkouts = [...offline, ...remoteWorkouts];
      setWorkouts(allWorkouts);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      const offline = getOfflineWorkoutQueue();
      if (offline.length > 0) {
        setWorkouts(offline);
      }
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

  const totalTonnage = workouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);
  const totalSessions = workouts.length;

  return (
    <div className="min-h-screen w-full bg-white text-[#111111] flex flex-col selection:bg-[#FF4A00] selection:text-white pb-24">
      <Header
        userWeight={user?.weightKg}
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
        userName={user?.name}
      />

      <main className="flex-1 w-full px-3.5 sm:px-8 lg:px-12 2xl:px-16 py-4 sm:py-8 space-y-6 max-w-[1920px] mx-auto">
        {/* Page Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#FF4A00] text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                Workout Calendar
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-tight uppercase">
              Training Schedule &amp; History
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
              Select any date on the calendar to inspect that day&apos;s workout session, set benchmarks, and muscle engagement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/workout/active"
              className="w-full sm:w-auto py-3 px-6 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
            >
              <Dumbbell className="w-4 h-4" />
              <span>Start Live Lift</span>
            </Link>
          </div>
        </div>

        {/* Top Telemetry Stats Grid for Larger Screens */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
              Total Logged
            </span>
            <p className="text-xl sm:text-2xl font-black font-mono text-zinc-900 mt-1">
              {totalSessions} <span className="text-xs font-sans font-bold text-zinc-400">sessions</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4A00] block">
              Lifetime Tonnage
            </span>
            <p className="text-xl sm:text-2xl font-black font-mono text-[#FF4A00] mt-1">
              {totalTonnage.toLocaleString()} <span className="text-xs font-sans font-bold text-zinc-500">kg</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
              Selected Date
            </span>
            <p className="text-base sm:text-lg font-black text-zinc-900 truncate mt-1">
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
              Workouts On Selected Day
            </span>
            <p className="text-xl sm:text-2xl font-black font-mono text-zinc-900 mt-1">
              {workouts.filter((w) => {
                const d = new Date(w.createdAt || w.startedAt || Date.now());
                return d.toDateString() === selectedDate.toDateString();
              }).length} <span className="text-xs font-sans font-bold text-zinc-400">logged</span>
            </p>
          </div>
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
          {/* Left Column: Calendar & Monthly Training Days */}
          <div className="lg:col-span-5 2xl:col-span-4 space-y-5">
            <WorkoutCalendar
              workouts={workouts}
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
            />

            {/* Quick Active Days in Selected Month */}
            {(() => {
              const activeMonthWorkouts = workouts.filter((w) => {
                const d = new Date(w.createdAt || w.startedAt || Date.now());
                return (
                  d.getFullYear() === selectedDate.getFullYear() &&
                  d.getMonth() === selectedDate.getMonth()
                );
              });

              if (activeMonthWorkouts.length === 0) return null;

              return (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200/80 p-4 sm:p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">
                      Active Days This Month ({activeMonthWorkouts.length})
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {activeMonthWorkouts.map((w, idx) => {
                      const d = new Date(w.createdAt || w.startedAt || Date.now());
                      const isSelected = selectedDate.toDateString() === d.toDateString();
                      const dayLabel = d.toLocaleDateString('en-US', {
                        weekday: 'short',
                        day: 'numeric',
                      });

                      return (
                        <button
                          key={w._id || idx}
                          type="button"
                          onClick={() => setSelectedDate(d)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-zinc-900 text-white shadow-sm ring-2 ring-[#FF4A00]'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          <span>{dayLabel}</span>
                          <span className="text-[10px] text-[#FF4A00] font-mono">
                            {w.exercises?.length || 0} moves
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right Column: Selected Day Workout Breakdown */}
          <div className="lg:col-span-7 2xl:col-span-8 space-y-5">
            <DayWorkoutDetail
              selectedDate={selectedDate}
              workouts={workouts}
              onDeleteWorkout={handleDeleteWorkout}
            />
          </div>
        </div>
      </main>

      <WeightQuickEditModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        currentWeight={user?.weightKg || 75}
        onSaveWeight={handleSaveWeight}
      />
    </div>
  );
}
