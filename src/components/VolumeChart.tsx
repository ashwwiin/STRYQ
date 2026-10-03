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
    <div className="white-card rounded-3xl p-6 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FF4A00]">
            <TrendingUp className="w-4 h-4" />
            <span>Weekly Volume Progression</span>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 tracking-tight mt-1 font-mono">
            {formatNumber(totalTonnage)} <span className="text-sm font-semibold text-zinc-500 font-sans">kg lifted</span>
          </h3>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-xs font-semibold text-zinc-400">Sessions</span>
            <p className="font-black text-sm text-zinc-800">{totalSessions}</p>
          </div>
          <div className="w-[1px] h-6 bg-zinc-200" />
          <div>
            <span className="text-xs font-semibold text-zinc-400">Burn</span>
            <p className="font-black text-sm text-[#FF4A00]">{formatNumber(totalCalories)} kcal</p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="pt-3">
        <div className="grid grid-cols-7 gap-3 items-end h-32 px-1">
          {last7Days.map((item, index) => {
            const heightPercent = item.volume > 0 ? Math.max(18, Math.round((item.volume / maxVolume) * 100)) : 6;
            const isToday = index === 6;

            return (
              <div key={index} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] font-mono font-bold text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.volume > 0 ? `${Math.round(item.volume / 1000 * 10) / 10}k` : '0'}
                </div>

                <div className="w-full max-w-[32px] bg-zinc-100 rounded-t-xl overflow-hidden flex items-end h-24 border border-zinc-200/60">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      item.volume > 0
                        ? isToday
                          ? 'bg-[#FF4A00] shadow-md shadow-orange-500/25'
                          : 'bg-gradient-to-t from-orange-500 to-[#FF4A00]'
                        : 'bg-zinc-200/50'
                    }`}
                  />
                </div>

                <span className={`text-[11px] font-bold ${isToday ? 'text-[#FF4A00]' : 'text-zinc-500'}`}>
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
