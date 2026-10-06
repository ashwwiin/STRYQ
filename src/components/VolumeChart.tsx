'use client';

import React from 'react';
import { formatNumber } from '@/lib/math';
import { TrendingUp, Dumbbell, Flame } from 'lucide-react';

interface VolumeChartProps {
  workouts: any[];
}

export default function VolumeChart({ workouts = [] }: VolumeChartProps) {
  const totalTonnage = workouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);
  const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const totalSessions = workouts.length;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const dayName = days[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];
    
    const dayWorkouts = workouts.filter((w) => {
      const wDate = new Date(w.createdAt || Date.now()).toISOString().split('T')[0];
      return wDate === dateStr;
    });

    const dayVolume = dayWorkouts.reduce((acc, w) => acc + (w.totalVolumeKg || 0), 0);
    const dayCount = dayWorkouts.length;

    return {
      day: dayName,
      date: dateStr,
      volume: dayVolume,
      count: dayCount,
    };
  });

  const maxVolume = Math.max(...last7Days.map((d) => d.volume), 5000);

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 transition-shadow hover:shadow-lg space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FF4A00]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Weekly Volume Progression</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight mt-1 font-mono">
            {formatNumber(totalTonnage)}{' '}
            <span className="text-xs sm:text-sm font-semibold text-zinc-500 font-sans">kg lifted</span>
          </h3>
        </div>

        <div className="flex items-center gap-3 text-right">
          <div className="rounded-xl bg-zinc-50 px-2.5 py-1.5 border border-zinc-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Sessions</span>
            <p className="font-black text-xs sm:text-sm text-zinc-900">{totalSessions}</p>
          </div>
          <div className="rounded-xl bg-orange-50 px-2.5 py-1.5 border border-orange-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4A00] block">Burn</span>
            <p className="font-black text-xs sm:text-sm text-[#FF4A00]">{formatNumber(totalCalories)} kcal</p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="pt-2">
        <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-28 px-1">
          {last7Days.map((item, index) => {
            const heightPercent = item.volume > 0 ? Math.max(22, Math.round((item.volume / maxVolume) * 100)) : 8;
            const isToday = index === 6;

            return (
              <div key={index} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="text-[9px] sm:text-[10px] font-mono font-bold text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.volume > 0 ? `${Math.round((item.volume / 1000) * 10) / 10}k` : '0'}
                </div>

                <div className="w-full max-w-[28px] sm:max-w-[34px] bg-zinc-100 rounded-t-lg overflow-hidden flex items-end h-20 border border-zinc-200/60">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      item.volume > 0
                        ? 'bg-gradient-to-t from-[#e04000] to-[#FF4A00] shadow-sm shadow-orange-500/30'
                        : 'bg-zinc-200/40'
                    }`}
                  />
                </div>

                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${isToday ? 'text-[#FF4A00]' : 'text-zinc-600'}`}>
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
