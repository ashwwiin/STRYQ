'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import WorkoutCalendar from '@/components/WorkoutCalendar';
import DayWorkoutDetail from '@/components/DayWorkoutDetail';
import WeightQuickEditModal from '@/components/WeightQuickEditModal';
import {
  Calendar as CalendarIcon,
  Dumbbell,
  Plus,
  TrendingUp,
  Award,
  Layers,
} from 'lucide-react';
import { formatNumber } from '@/lib/math';
import { getOfflineWorkoutQueue, getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/storage';

export default function CalendarPage() {
  const [user, setUser] = useState<{
    id?: string;
    name: string;
    email?: string;
    weightKg: number;
  } | null>(() => getCachedUser());

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

      <main className="flex-1 w-full px-3 sm:px-8 lg:px-12 2xl:px-16 py-5 sm:py-8 space-y-6 sm:space-y-8 max-w-[1920px] mx-auto">
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
              Click any day on the calendar to view full set-by-set workout logs or record training.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/workout/active"
              className="w-full sm:w-auto py-3 sm:py-3.5 px-6 sm:px-7 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
            >
              <Dumbbell className="w-4 h-4" />
              <span>Start Live Lift</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Calendar & Day Detail Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
          {/* Left Column: Interactive Month Calendar (7 cols) */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <WorkoutCalendar
              workouts={workouts}
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
            />
          </div>

          {/* Right Column: Selected Day Workout Breakdown (5 cols) */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
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
