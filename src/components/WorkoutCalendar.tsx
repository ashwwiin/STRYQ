'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Dumbbell,
} from 'lucide-react';
import { formatNumber } from '@/lib/math';

interface WorkoutCalendarProps {
  workouts: any[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  className?: string;
}

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAYS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WorkoutCalendar({
  workouts = [],
  selectedDate,
  onSelectDate,
  className = '',
}: WorkoutCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Helper to format date as YYYY-MM-DD
  const toDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Group workouts by YYYY-MM-DD
  const workoutsByDate: Record<string, any[]> = {};
  workouts.forEach((w) => {
    const d = new Date(w.createdAt || w.startedAt || Date.now());
    const key = toDateString(d);
    if (!workoutsByDate[key]) {
      workoutsByDate[key] = [];
    }
    workoutsByDate[key].push(w);
  });

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay();
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays = [];
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  const currentMonthDays = [];
  for (let d = 1; d <= totalDaysInMonth; d++) {
    currentMonthDays.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  // Next month leading days
  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  const nextMonthDays = [];
  for (let d = 1; d <= remainingCells; d++) {
    nextMonthDays.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    });
  }

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(today);
  };

  const monthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const todayStr = toDateString(new Date());
  const selectedStr = toDateString(selectedDate);

  // Month aggregate stats
  const monthWorkouts = workouts.filter((w) => {
    const d = new Date(w.createdAt || w.startedAt || Date.now());
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const monthVolume = monthWorkouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);
  const monthCalories = monthWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

  return (
    <div className={`bg-white rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-sm p-4 sm:p-6 lg:p-7 ${className}`}>
      {/* Calendar Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#FF4A00]/10 text-[#FF4A00] shrink-0">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-zinc-900 uppercase tracking-tight truncate">
              {monthLabel}
            </h3>
            <p className="hidden sm:block text-xs text-zinc-400 font-medium">
              Click any date to inspect workout details
            </p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleGoToday}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors active:scale-95"
          >
            Today
          </button>
          <div className="flex items-center gap-0.5 bg-zinc-100 p-0.5 sm:p-1 rounded-full">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1 sm:p-1.5 rounded-full hover:bg-white text-zinc-700 hover:text-zinc-900 transition-colors shadow-none hover:shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1 sm:p-1.5 rounded-full hover:bg-white text-zinc-700 hover:text-zinc-900 transition-colors shadow-none hover:shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Month Telemetry Quick Banner */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 my-3 sm:my-4 p-2.5 sm:p-3.5 bg-zinc-50 rounded-xl sm:rounded-2xl border border-zinc-100 text-center">
        <div className="px-1">
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block truncate">
            Sessions
          </span>
          <p className="text-sm sm:text-lg font-black text-zinc-900 font-mono">
            {monthWorkouts.length} <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 font-sans hidden sm:inline">done</span>
          </p>
        </div>

        <div className="px-1 border-x border-zinc-200/60">
          <span className="text-[9px] sm:text-[10px] font-bold text-[#FF4A00] uppercase tracking-wider block truncate">
            Tonnage
          </span>
          <p className="text-sm sm:text-lg font-black text-[#FF4A00] font-mono">
            {formatNumber(monthVolume)} <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 font-sans">kg</span>
          </p>
        </div>

        <div className="px-1">
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block truncate">
            MET Calories
          </span>
          <p className="text-sm sm:text-lg font-black text-zinc-900 font-mono">
            ~{formatNumber(monthCalories)} <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 font-sans hidden sm:inline">kcal</span>
          </p>
        </div>
      </div>

      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2 text-center">
        {DAYS_FULL.map((day, idx) => (
          <div
            key={idx}
            className={`py-1 text-[11px] font-black uppercase tracking-wider ${
              idx === 0 || idx === 6 ? 'text-zinc-400' : 'text-zinc-600'
            }`}
          >
            <span className="sm:hidden">{DAYS_SHORT[idx]}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {allCalendarDays.map(({ date, isCurrentMonth }, index) => {
          const dateStr = toDateString(date);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedStr;
          const dayWorkouts = workoutsByDate[dateStr] || [];
          const hasWorkouts = dayWorkouts.length > 0;
          const dayNumber = date.getDate();

          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                onSelectDate(date);
                if (!isCurrentMonth) {
                  setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                }
              }}
              className={`group relative flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-xl sm:rounded-2xl aspect-square min-h-[46px] sm:min-h-[54px] border transition-all text-center ${
                isSelected
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-md ring-2 ring-[#FF4A00]'
                  : hasWorkouts
                  ? 'bg-orange-50 hover:bg-orange-100/80 border-orange-200/80 text-zinc-900 font-bold'
                  : isCurrentMonth
                  ? 'bg-white hover:bg-zinc-50 border-zinc-200/70 text-zinc-800'
                  : 'bg-zinc-50/40 hover:bg-zinc-100/40 border-transparent text-zinc-300'
              }`}
            >
              {/* Day Number */}
              <div className="w-full flex items-center justify-center flex-1">
                <span
                  className={`inline-grid place-items-center h-6 w-6 sm:h-7 sm:w-7 rounded-full text-xs sm:text-sm font-black font-mono transition-colors ${
                    isSelected
                      ? 'text-white'
                      : isToday
                      ? 'bg-[#FF4A00] text-white shadow-sm'
                      : isCurrentMonth
                      ? 'text-zinc-800 group-hover:text-zinc-900'
                      : 'text-zinc-300'
                  }`}
                >
                  {dayNumber}
                </span>
              </div>

              {/* Workout Indicator Dots */}
              <div className="w-full flex items-center justify-center gap-1 h-2">
                {hasWorkouts && (
                  <div className="flex items-center justify-center gap-0.5">
                    {dayWorkouts.slice(0, 3).map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-[#FF4A00]' : 'bg-[#FF4A00]'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
