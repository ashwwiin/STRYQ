'use client';

import React, { useState } from 'react';
import { formatDuration, formatNumber } from '@/lib/math';
import { Activity, Dumbbell, CheckCircle2, ChevronDown, Trash2 } from 'lucide-react';

interface WorkoutCardProps {
  workout: any;
  onDelete?: (workoutId: string) => Promise<void>;
}

export default function WorkoutCard({ workout, onDelete }: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedDate = new Date(workout.createdAt || Date.now()).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const exerciseCount = workout.exercises?.length || 0;

  const metrics = [
    { label: 'Duration', value: formatDuration(workout.durationSeconds || 0), accent: false },
    { label: 'Weight lifted', value: `${formatNumber(workout.totalVolumeKg || 0)} kg`, accent: true },
    { label: 'Calories', value: `~${workout.caloriesBurned || 0}`, accent: false },
  ];

  return (
    <article className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-lg sm:p-6">
      {/* Top row: date, title, icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-500">{formattedDate}</p>
          <h4 className="mt-0.5 truncate text-lg font-black tracking-tight text-zinc-900">
            {workout.title || 'Workout'}
          </h4>
        </div>

        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-[#FF4A00] border border-orange-100 uppercase">
          <Dumbbell className="h-3.5 w-3.5" />
          Logged
        </span>
      </div>

      {/* Metrics: divided columns, no extra box */}
      <dl className="mt-5 grid grid-cols-3 divide-x divide-zinc-200 border-y border-zinc-200 py-4">
        {metrics.map((m, i) => (
          <div key={m.label} className={`min-w-0 ${i === 0 ? 'pr-3' : 'px-3 sm:px-4'}`}>
            <dt className="truncate text-xs font-medium text-zinc-500">{m.label}</dt>
            <dd
              className={`mt-1 truncate text-base font-black tracking-tight sm:text-lg ${m.accent ? 'text-[#FF4A00]' : 'text-zinc-900'
                }`}
            >
              {m.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Exercises toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="mt-3 flex w-full items-center justify-between rounded-xl py-2 text-sm font-bold text-zinc-700 transition hover:text-zinc-900"
      >
        <span>
          {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-2 space-y-4">
          {workout.exercises?.map((exercise: any, exIdx: number) => {
            const completedSets = (exercise.sets || []).filter((s: any) => s.completed);
            return (
              <div key={exIdx} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-bold text-zinc-900">
                  <span className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-[#FF4A00]" />
                    {exercise.name}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">
                    {completedSets.length} {completedSets.length === 1 ? 'set' : 'sets'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {completedSets.map((set: any, sIdx: number) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-xs"
                    >
                      <span className="font-medium text-zinc-500">Set {set.setNumber || sIdx + 1}</span>
                      <span className="font-bold text-zinc-900">
                        {set.weightKg} kg &times; {set.reps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {onDelete && workout._id && !workout._id.startsWith('seed_') && (
            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              {confirmDelete ? (
                <>
                  <span className="mr-auto text-xs font-semibold text-zinc-600">Delete this workout?</span>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-full px-3 py-1.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onDelete(workout._id)}
                    className="rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
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