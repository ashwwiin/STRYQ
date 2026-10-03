'use client';

import React, { useEffect, useState } from 'react';
import { Play, Pause, X, BellRing } from 'lucide-react';
import { triggerVibration, playRestTimerBeep } from '@/lib/sound';

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSeconds?: number;
}

export default function RestTimerModal({
  isOpen,
  onClose,
  defaultSeconds = 90,
}: RestTimerModalProps) {
  const [targetSeconds, setTargetSeconds] = useState(defaultSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setRemainingSeconds(targetSeconds);
    setIsRunning(true);
  }, [targetSeconds, isOpen]);

  useEffect(() => {
    if (!isOpen || !isRunning) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerVibration([200, 100, 200, 100, 300]);
          playRestTimerBeep('long');
          setIsRunning(false);
          return 0;
        }

        if (prev === 4 || prev === 3 || prev === 2) {
          triggerVibration([80]);
          playRestTimerBeep('short');
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning]);

  if (!isOpen) return null;

  const progressPercent = targetSeconds > 0 ? ((targetSeconds - remainingSeconds) / targetSeconds) * 100 : 0;
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  const setPreset = (seconds: number) => {
    setTargetSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsRunning(true);
  };

  const addTime = (delta: number) => {
    setRemainingSeconds((prev) => Math.max(0, prev + delta));
    setTargetSeconds((prev) => Math.max(0, prev + delta));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-6 text-center">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-orange-50 text-[#FF4A00]">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-left">
              <h3 className="font-black text-lg text-zinc-900">Rest Stopwatch</h3>
              <p className="text-xs text-zinc-500">Audio & haptic alerts on zero</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Circular Display */}
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#f3f4f6"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#FF4A00"
              strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black font-mono tracking-tighter text-zinc-900">
              {timeFormatted}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF4A00] mt-1">
              {remainingSeconds === 0 ? 'READY TO LIFT!' : isRunning ? 'RESTING' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="grid grid-cols-5 gap-1.5">
          {[30, 60, 90, 120, 180].map((sec) => (
            <button
              key={sec}
              onClick={() => setPreset(sec)}
              className={`py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                targetSeconds === sec
                  ? 'bg-[#FF4A00] text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {sec < 60 ? `${sec}s` : `${sec / 60}m`}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => addTime(-15)}
            className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 active:scale-95"
          >
            -15s
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-14 h-14 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black flex items-center justify-center shadow-lg shadow-orange-600/30 active:scale-95 transition-transform"
          >
            {isRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => addTime(15)}
            className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 active:scale-95"
          >
            +15s
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold"
        >
          Dismiss / Back to Sets
        </button>
      </div>
    </div>
  );
}
