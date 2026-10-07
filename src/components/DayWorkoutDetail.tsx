'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatDuration, formatNumber } from '@/lib/math';
import {
  Calendar,
  Dumbbell,
  Plus,
  Trash2,
  Zap,
  ChevronDown,
  ChevronUp,
  Flame,
  ListOrdered,
} from 'lucide-react';
import MuscleMap from '@/components/MuscleMap';

interface DayWorkoutDetailProps {
  selectedDate: Date;
  workouts: any[];
  onDeleteWorkout?: (id: string) => Promise<void>;
  onLogForDate?: (dateStr: string) => void;
}

export default function DayWorkoutDetail({
  selectedDate,
  workouts,
  onDeleteWorkout,
}: DayWorkoutDetailProps) {
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'muscles' | 'exercises'>('all');

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(
    selectedDate.getDate()
  )}`;

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isToday =
    new Date().toDateString() === selectedDate.toDateString();

  // Filter workouts for this specific day
  const dayWorkouts = workouts.filter((w) => {
    const d = new Date(w.createdAt || w.startedAt || Date.now());
    const wDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return wDateStr === dateStr;
  });

  const dayExercises = dayWorkouts.flatMap((w) => w.exercises || []);

  const totalDayVolume = dayWorkouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);
  const totalDayCalories = dayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const totalDayDuration = dayWorkouts.reduce((sum, w) => sum + (w.durationSeconds || 0), 0);

  const toggleExpand = (id: string) => {
    setExpandedWorkouts((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const isExpanded = (id: string) => {
    return expandedWorkouts[id] !== false;
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteWorkout) return;
    setDeletingId(id);
    try {
      await onDeleteWorkout(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-[#141417] rounded-2xl sm:rounded-3xl border border-zinc-800/80 shadow-sm p-4 sm:p-6 lg:p-7 space-y-5 text-white">
      {/* Selected Day Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#FF4A00] flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {isToday ? 'Today' : 'Selected Day'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight truncate">
            {formattedDate}
          </h3>
        </div>

        <Link
          href={`/workout/active?mode=past&date=${dateStr}`}
          className="w-full sm:w-auto py-2.5 px-4 sm:px-5 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-[#FF4A00]" />
          <span>+ Log Workout</span>
        </Link>
      </div>

      {/* If workouts exist on this day */}
      {dayWorkouts.length > 0 ? (
        <div className="space-y-4 sm:space-y-5">
          {/* Day Aggregate Stats */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl border border-zinc-800/80 text-center">
            <div className="px-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block truncate">
                Tonnage
              </span>
              <p className="text-sm sm:text-lg font-black text-[#FF4A00] font-mono">
                {formatNumber(totalDayVolume)} <span className="text-[10px] sm:text-xs font-sans text-zinc-500">kg</span>
              </p>
            </div>

            <div className="px-1 border-x border-zinc-800">
              <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block truncate">
                Time
              </span>
              <p className="text-sm sm:text-lg font-black text-white font-mono">
                {formatDuration(totalDayDuration)}
              </p>
            </div>

            <div className="px-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block truncate">
                Calories
              </span>
              <p className="text-sm sm:text-lg font-black text-white font-mono">
                ~{formatNumber(totalDayCalories)} <span className="text-[10px] sm:text-xs font-sans text-zinc-500 hidden sm:inline">kcal</span>
              </p>
            </div>
          </div>

          {/* Sub-tabs: All, Muscle Map, Exercise Breakdown */}
          <div className="inline-flex rounded-full bg-zinc-900 border border-zinc-800 p-1 text-xs font-bold w-full">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 rounded-full text-[11px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
                activeTab === 'all'
                  ? 'bg-[#FF4A00] text-white shadow-md shadow-orange-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Dumbbell className="w-3 h-3" />
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('muscles')}
              className={`flex-1 py-1.5 rounded-full text-[11px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
                activeTab === 'muscles'
                  ? 'bg-[#FF4A00] text-white shadow-md shadow-orange-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Muscle Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exercises')}
              className={`flex-1 py-1.5 rounded-full text-[11px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
                activeTab === 'exercises'
                  ? 'bg-[#FF4A00] text-white shadow-md shadow-orange-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3 h-3" />
              <span>Workouts ({dayWorkouts.length})</span>
            </button>
          </div>

          {/* Content Views */}
          {activeTab === 'all' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Muscle Map Column */}
              <div className="xl:col-span-5 space-y-3">
                <MuscleMap
                  exercises={dayExercises}
                  title={`Muscles Worked`}
                  subtitle={`${dayWorkouts.length} ${dayWorkouts.length === 1 ? 'session' : 'sessions'} on ${formattedDate}`}
                  defaultOpen={true}
                  collapsible={false}
                />
              </div>

              {/* Logged Workouts Column */}
              <div className="xl:col-span-7 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    Logged Sessions ({dayWorkouts.length})
                  </h4>
                </div>

                {dayWorkouts.map((workout, wIdx) => {
                  const open = isExpanded(workout._id || `w_${wIdx}`);
                  const exercises = workout.exercises || [];

                  return (
                    <div
                      key={workout._id || wIdx}
                      className="rounded-xl sm:rounded-2xl border border-zinc-800/80 bg-[#18181c] overflow-hidden shadow-sm transition-all"
                    >
                      {/* Workout Header Bar */}
                      <div
                        onClick={() => toggleExpand(workout._id || `w_${wIdx}`)}
                        className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/40 transition-colors gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-orange-500/15 text-[#FF4A00] border border-orange-500/20 shrink-0">
                            <Dumbbell className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-sm sm:text-base text-white uppercase tracking-tight truncate">
                              {workout.title || 'Strength Workout'}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-zinc-400 font-medium">
                              <span>{formatDuration(workout.durationSeconds || 0)}</span>
                              <span>&bull;</span>
                              <span className="font-bold text-[#FF4A00]">
                                {formatNumber(workout.totalVolumeKg || 0)} kg
                              </span>
                              <span>&bull;</span>
                              <span>{exercises.length} moves</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(workout._id);
                            }}
                            disabled={deletingId === workout._id}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete workout"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="p-1 text-zinc-400">
                            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Workout Breakdown: Sets & Exercises */}
                      {open && (
                        <div className="p-3 sm:p-4 border-t border-zinc-800/80 bg-zinc-950/40 space-y-3">
                          {exercises.map((ex: any, exIndex: number) => {
                            const sets = ex.sets || [];

                            const topSet = sets.reduce(
                              (max: any, s: any) => (s.est1RM > (max?.est1RM || 0) ? s : max),
                              null
                            );

                            return (
                              <div
                                key={exIndex}
                                className="bg-[#141417] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-zinc-800/80 space-y-2.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-black text-xs sm:text-sm text-white uppercase truncate">
                                      {ex.name}
                                    </span>
                                    {ex.isCompound && (
                                      <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black uppercase bg-orange-500/15 text-[#FF4A00] border border-orange-500/20 shrink-0">
                                        Compound
                                      </span>
                                    )}
                                  </div>

                                  {topSet && topSet.est1RM > 0 && (
                                    <span className="text-[10px] font-mono font-black text-zinc-300 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                      <Zap className="w-2.5 h-2.5 text-[#FF4A00]" />
                                      1RM ~{topSet.est1RM}kg
                                    </span>
                                  )}
                                </div>

                                {/* Sets Table */}
                                <div className="space-y-1">
                                  <div className="grid grid-cols-4 text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-2">
                                    <span>Set</span>
                                    <span className="text-center">Weight</span>
                                    <span className="text-center">Reps</span>
                                    <span className="text-right">1RM</span>
                                  </div>

                                  {sets.map((set: any, sIdx: number) => (
                                    <div
                                      key={sIdx}
                                      className={`grid grid-cols-4 items-center px-2 sm:px-3 py-1.5 rounded-lg text-xs font-mono ${
                                        set.completed !== false
                                          ? 'bg-zinc-900/80 border border-zinc-800/60 text-zinc-200'
                                          : 'bg-zinc-900/40 text-zinc-500 line-through'
                                      }`}
                                    >
                                      <span className="font-bold text-zinc-400 font-sans text-[11px]">
                                        #{set.setNumber || sIdx + 1}
                                      </span>
                                      <span className="text-center font-black text-white">
                                        {set.weightKg}<span className="text-[10px] text-zinc-500 font-sans">kg</span>
                                      </span>
                                      <span className="text-center font-black text-white">{set.reps}</span>
                                      <span className="text-right font-black text-[#FF4A00]">
                                        {set.est1RM ? `${set.est1RM}kg` : '-'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Muscle Map Only Tab */}
          {activeTab === 'muscles' && (
            <div className="space-y-2">
              <MuscleMap
                exercises={dayExercises}
                title={`Muscles Worked on ${formattedDate}`}
                subtitle={`${dayWorkouts.length} ${dayWorkouts.length === 1 ? 'session' : 'sessions'} logged`}
                defaultOpen={true}
                collapsible={false}
              />
            </div>
          )}

          {/* Workouts Only Tab */}
          {activeTab === 'exercises' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Logged Sessions ({dayWorkouts.length})
                </h4>
              </div>

              {dayWorkouts.map((workout, wIdx) => {
                const open = isExpanded(workout._id || `w_${wIdx}`);
                const exercises = workout.exercises || [];

                return (
                  <div
                    key={workout._id || wIdx}
                    className="rounded-xl sm:rounded-2xl border border-zinc-800/80 bg-[#18181c] overflow-hidden shadow-sm transition-all"
                  >
                    {/* Workout Header Bar */}
                    <div
                      onClick={() => toggleExpand(workout._id || `w_${wIdx}`)}
                      className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/40 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-orange-500/15 text-[#FF4A00] border border-orange-500/20 shrink-0">
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-sm sm:text-base text-white uppercase tracking-tight truncate">
                            {workout.title || 'Strength Workout'}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-zinc-400 font-medium">
                            <span>{formatDuration(workout.durationSeconds || 0)}</span>
                            <span>&bull;</span>
                            <span className="font-bold text-[#FF4A00]">
                              {formatNumber(workout.totalVolumeKg || 0)} kg
                            </span>
                            <span>&bull;</span>
                            <span>{exercises.length} moves</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(workout._id);
                          }}
                          disabled={deletingId === workout._id}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete workout"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="p-1 text-zinc-400">
                          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Workout Breakdown: Sets & Exercises */}
                    {open && (
                      <div className="p-3 sm:p-4 border-t border-zinc-800/80 bg-zinc-950/40 space-y-3">
                        {exercises.map((ex: any, exIndex: number) => {
                          const sets = ex.sets || [];

                          const topSet = sets.reduce(
                            (max: any, s: any) => (s.est1RM > (max?.est1RM || 0) ? s : max),
                            null
                          );

                          return (
                            <div
                              key={exIndex}
                              className="bg-[#141417] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-zinc-800/80 space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-black text-xs sm:text-sm text-white uppercase truncate">
                                    {ex.name}
                                  </span>
                                  {ex.isCompound && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black uppercase bg-orange-500/15 text-[#FF4A00] border border-orange-500/20 shrink-0">
                                      Compound
                                    </span>
                                  )}
                                </div>

                                {topSet && topSet.est1RM > 0 && (
                                  <span className="text-[10px] font-mono font-black text-zinc-300 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                    <Zap className="w-2.5 h-2.5 text-[#FF4A00]" />
                                    1RM ~{topSet.est1RM}kg
                                  </span>
                                )}
                              </div>

                              {/* Sets Table */}
                              <div className="space-y-1">
                                <div className="grid grid-cols-4 text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-2">
                                  <span>Set</span>
                                  <span className="text-center">Weight</span>
                                  <span className="text-center">Reps</span>
                                  <span className="text-right">1RM</span>
                                </div>

                                {sets.map((set: any, sIdx: number) => (
                                  <div
                                    key={sIdx}
                                    className={`grid grid-cols-4 items-center px-2 sm:px-3 py-1.5 rounded-lg text-xs font-mono ${
                                      set.completed !== false
                                        ? 'bg-zinc-900/80 border border-zinc-800/60 text-zinc-200'
                                        : 'bg-zinc-900/40 text-zinc-500 line-through'
                                    }`}
                                  >
                                    <span className="font-bold text-zinc-400 font-sans text-[11px]">
                                      #{set.setNumber || sIdx + 1}
                                    </span>
                                    <span className="text-center font-black text-white">
                                      {set.weightKg}<span className="text-[10px] text-zinc-500 font-sans">kg</span>
                                    </span>
                                    <span className="text-center font-black text-white">{set.reps}</span>
                                    <span className="text-right font-black text-[#FF4A00]">
                                      {set.est1RM ? `${set.est1RM}kg` : '-'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Empty State for this day */
        <div className="p-6 sm:p-8 text-center rounded-2xl sm:rounded-3xl bg-[#18181c] border border-dashed border-zinc-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-[#FF4A00] flex items-center justify-center mx-auto border border-orange-500/20">
            <Calendar className="w-6 h-6" />
          </div>

          <div className="space-y-0.5 max-w-sm mx-auto">
            <h4 className="font-black text-sm sm:text-base uppercase text-white">
              No Workouts on This Day
            </h4>
            <p className="text-xs text-zinc-400 font-medium">
              {isToday
                ? 'Ready to hit the weights today?'
                : `No logged training for ${formattedDate}.`}
            </p>
          </div>

          <div className="pt-1">
            <Link
              href={`/workout/active?mode=past&date=${dateStr}`}
              className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Training Session</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
