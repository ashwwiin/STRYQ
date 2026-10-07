'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { formatDuration, formatNumber } from '@/lib/math';
import { Trophy, Dumbbell, Zap, ArrowRight, X, CheckCircle2 } from 'lucide-react';

interface FinishWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutData: {
    title: string;
    durationSeconds: number;
    totalVolumeKg: number;
    caloriesBurned: number;
    exercises: {
      name: string;
      isCompound: boolean;
      sets: {
        setNumber: number;
        weightKg: number;
        reps: number;
        est1RM: number;
        completed: boolean;
      }[];
    }[];
  };
  onSaveAndSync: () => Promise<void>;
}

export default function FinishWorkoutModal({
  isOpen,
  onClose,
  workoutData,
  onSaveAndSync,
}: FinishWorkoutModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [sessionTitle, setSessionTitle] = useState(workoutData.title || 'STRYQ Strength Session');

  useEffect(() => {
    if (isOpen) {
      setSessionTitle(workoutData.title || 'STRYQ Strength Session');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF4A00', '#FF7700', '#FFAA00', '#10b981'],
        });
      } catch {}
    }
  }, [isOpen, workoutData.title]);

  if (!isOpen) return null;

  const prList: { name: string; est1RM: number; weight: number; reps: number }[] = [];
  workoutData.exercises.forEach((ex) => {
    const completedSets = ex.sets.filter((s) => s.completed && s.est1RM > 0);
    if (completedSets.length > 0) {
      const topSet = completedSets.reduce((max, set) => (set.est1RM > max.est1RM ? set : max), completedSets[0]);
      prList.push({
        name: ex.name,
        est1RM: topSet.est1RM,
        weight: topSet.weightKg,
        reps: topSet.reps,
      });
    }
  });

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      workoutData.title = sessionTitle;
      await onSaveAndSync();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#141417] border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto text-white">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-3 rounded-2xl bg-[#FF4A00] text-white shadow-lg shadow-orange-950/50">
              <Trophy className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-xl text-white tracking-tight">Session Complete!</h3>
              <p className="text-xs text-zinc-400">Benchmark breakdown &amp; saving to log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title Input */}
        <div>
          <label className="text-xs font-bold text-zinc-400 block mb-1">Session Title</label>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-black text-white focus:outline-none focus:border-[#FF4A00] focus:bg-black transition"
          />
        </div>

        {/* 3 Core Metric Highlights */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-zinc-900/80 rounded-2xl p-3 border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Duration</span>
            <span className="text-lg font-black text-white font-mono">
              {formatDuration(workoutData.durationSeconds)}
            </span>
          </div>

          <div className="bg-orange-950/30 rounded-2xl p-3 border border-orange-500/30">
            <span className="text-[10px] font-bold text-[#FF4A00] uppercase tracking-wider block">Tonnage</span>
            <span className="text-lg font-black text-[#FF4A00] font-mono">
              {formatNumber(workoutData.totalVolumeKg)} <span className="text-xs font-normal text-zinc-400 font-sans">kg</span>
            </span>
          </div>

          <div className="bg-zinc-900/80 rounded-2xl p-3 border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">MET Burn</span>
            <span className="text-lg font-black text-white font-mono">
              ~{workoutData.caloriesBurned} <span className="text-xs font-normal text-zinc-400 font-sans">kcal</span>
            </span>
          </div>
        </div>

        {/* Top 1RM Benchmarks */}
        {prList.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#FF4A00]" />
              <span>1-Rep Max Benchmarks (Epley Formula)</span>
            </h4>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {prList.map((pr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
                >
                  <span className="font-bold text-zinc-200">{pr.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-[11px]">{pr.weight}kg &times; {pr.reps}</span>
                    <span className="font-black text-[#FF4A00] bg-orange-950/50 border border-orange-500/30 px-2 py-0.5 rounded font-mono">
                      1RM: {pr.est1RM} kg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="w-full py-4 px-4 rounded-2xl bg-[#FF4A00] hover:bg-[#E04200] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-950/50 active:scale-98 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{submitting ? 'Saving Workout...' : 'Save & Log Workout'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
}
