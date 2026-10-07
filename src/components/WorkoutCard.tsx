'use client';

import React, { useState } from 'react';
import { formatDuration, formatNumber } from '@/lib/math';
import { Dumbbell, ChevronDown, Trash2 } from 'lucide-react';

interface WorkoutCardProps {
  workout: any;
  onDelete?: (workoutId: string) => Promise<void>;
  isListItem?: boolean;
}

export default function WorkoutCard({ workout, onDelete, isListItem = false }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Determine category badge tint based on workout title / exercises
  const titleLower = (workout.title || '').toLowerCase();
  let categoryLabel = 'Strength';
  // Screenshot 1 tints: Copper/Orange for Push, Purple for Legs, Blue/Sky for Pull
  let badgeClasses = 'bg-orange-500/15 text-[#FF4A00] border border-orange-500/25';

  if (titleLower.includes('leg') || titleLower.includes('squat') || titleLower.includes('ham') || titleLower.includes('lower')) {
    categoryLabel = 'Legs';
    badgeClasses = 'bg-purple-500/15 text-purple-400 border border-purple-500/25';
  } else if (titleLower.includes('pull') || titleLower.includes('back') || titleLower.includes('deadlift')) {
    categoryLabel = 'Pull';
    badgeClasses = 'bg-sky-500/15 text-sky-400 border border-sky-500/25';
  } else if (titleLower.includes('push') || titleLower.includes('chest') || titleLower.includes('bench') || titleLower.includes('upper') || titleLower.includes('shoulder')) {
    categoryLabel = 'Push';
    badgeClasses = 'bg-orange-500/15 text-[#FF4A00] border border-orange-500/25';
  }

  // Calculate total sets
  const exercises = workout.exercises || [];
  const exerciseCount = exercises.length;
  const totalSets = exercises.reduce((sum: number, ex: any) => sum + (ex.sets?.length || 0), 0);

  // Relative time string
  const diffDays = Math.floor((Date.now() - new Date(workout.createdAt || Date.now()).getTime()) / 86400000);
  const relativeTime = diffDays <= 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;

  const containerClass = isListItem
    ? 'p-4 sm:p-5 transition-colors hover:bg-zinc-800/30'
    : 'bg-[#141417] border border-zinc-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all hover:border-zinc-700/80 shadow-sm';

  return (
    <article className={containerClass}>
      {/* Main Row */}
      <div
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        {/* Left: Category Badge + Title & Subtitle */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl grid place-items-center font-black text-sm shrink-0 shadow-inner ${badgeClasses}`}>
            <span>H</span>
          </div>

          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight truncate">
              {workout.title || 'Strength Session'}
            </h4>
            <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
              <span className="text-zinc-300 font-bold">{categoryLabel}</span> &middot; {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'} &middot; {totalSets} sets
            </p>
          </div>
        </div>

        {/* Right: Volume & Date */}
        <div className="text-right shrink-0">
          <p className="text-sm sm:text-base font-black font-mono text-white tracking-tight">
            {formatNumber(workout.totalVolumeKg || 0)} <span className="text-[10px] sm:text-xs font-sans font-normal text-zinc-400">kg</span>
          </p>
          <p className="text-[11px] font-semibold text-zinc-400 mt-0.5">
            {relativeTime}
          </p>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Duration</span>
              <span className="font-mono font-black text-white">{formatDuration(workout.durationSeconds || 0)}</span>
            </div>
            <div className="border-x border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Tonnage</span>
              <span className="font-mono font-black text-[#FF4A00]">{formatNumber(workout.totalVolumeKg || 0)} kg</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Burn</span>
              <span className="font-mono font-black text-white">~{workout.caloriesBurned || 0} kcal</span>
            </div>
          </div>

          <div className="space-y-3">
            {exercises.map((exercise: any, exIdx: number) => {
              const completedSets = (exercise.sets || []).filter((s: any) => s.completed !== false);
              return (
                <div key={exIdx} className="space-y-1.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-1.5 truncate">
                      <Dumbbell className="h-3.5 w-3.5 text-[#FF4A00]" />
                      {exercise.name}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-500 shrink-0">
                      {completedSets.length} sets
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                    {completedSets.map((set: any, sIdx: number) => (
                      <div
                        key={sIdx}
                        className="flex items-center justify-between rounded-lg bg-zinc-800/70 px-2.5 py-1 text-[11px] font-mono text-zinc-300"
                      >
                        <span className="text-zinc-500">#{set.setNumber || sIdx + 1}</span>
                        <span className="font-bold text-white">
                          {set.weightKg}k &times; {set.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {onDelete && workout._id && !workout._id.startsWith('seed_') && (
            <div className="flex items-center justify-end gap-2 pt-2">
              {confirmDelete ? (
                <>
                  <span className="mr-auto text-xs font-semibold text-zinc-400">Delete this workout?</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(false);
                    }}
                    className="rounded-full px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(workout._id);
                    }}
                    className="rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(true);
                  }}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete workout
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}