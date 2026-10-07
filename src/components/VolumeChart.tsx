'use client';

import React from 'react';
import { Activity } from 'lucide-react';

interface VolumeChartProps {
  workouts: any[];
}

export default function VolumeChart({ workouts = [] }: VolumeChartProps) {
  const daysShort = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDayIndex);

  const dayVolumes = daysShort.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const matchingWorkouts = workouts.filter((w) => {
      const wDate = new Date(w.createdAt || Date.now());
      const wKey = `${wDate.getFullYear()}-${String(wDate.getMonth() + 1).padStart(2, '0')}-${String(wDate.getDate()).padStart(2, '0')}`;
      return wKey === dateKey;
    });

    const totalVol = matchingWorkouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);
    return {
      label: daysShort[i],
      volume: totalVol,
      isToday: i === currentDayIndex,
      isFuture: i > currentDayIndex,
    };
  });

  const maxVol = Math.max(...dayVolumes.map((d) => d.volume), 1000);

  // SVG dimensions for smooth line curve
  const width = 340;
  const height = 90;
  const paddingX = 16;
  const paddingY = 12;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  // Compute point coordinates
  const points = dayVolumes.map((d, i) => {
    const x = paddingX + (i / 6) * usableWidth;
    // Normalized 0 to 1
    const normalizedY = d.volume > 0 ? d.volume / maxVol : 0.08;
    const y = height - paddingY - normalizedY * usableHeight;
    return { x, y, ...d };
  });

  // Construct smooth SVG path
  const linePath = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  // Construct closed area path for gradient
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const activePoint = points[currentDayIndex] || points[points.length - 1];

  return (
    <div className="flex flex-col rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-[#141417] p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-[#FF4A00]" />
        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
          Weekly Volume
        </h3>
      </div>

      {/* SVG Line Chart */}
      <div className="relative w-full pt-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-28 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="stryqVolumeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF4A00" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#FF4A00" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FF4A00" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glowPoint" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FF4A00" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Area Fill */}
          <path d={areaPath} fill="url(#stryqVolumeGrad)" />

          {/* Line Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#FF4A00"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Glowing Active Endpoint */}
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r="4.5"
            fill="#FF4A00"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            filter="url(#glowPoint)"
          />
        </svg>
      </div>

      {/* Day Labels Row */}
      <div className="grid grid-cols-7 text-center pt-1 border-t border-zinc-800/60">
        {dayVolumes.map((d, i) => (
          <span
            key={i}
            className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
              d.isToday ? 'text-[#FF4A00]' : 'text-zinc-500'
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
