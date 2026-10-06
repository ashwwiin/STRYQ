'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/storage';
import {
  User,
  Settings as SettingsIcon,
  Timer,
  Volume2,
  VolumeX,
  Vibrate,
  Shield,
  LogOut,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const REST_KEY = 'stryq_rest_seconds';
const AUTO_REST_KEY = 'stryq_auto_rest';
const SOUND_KEY = 'stryq_sound_enabled';

export default function SettingsPage() {
  const router = useRouter();
  const [cached] = useState(() => getCachedUser());
  const [user, setUser] = useState<{
    id?: string;
    name: string;
    email?: string;
    weightKg: number;
    sex?: string;
    heightCm?: number;
  } | null>(cached);

  // Local preferences
  const [restSeconds, setRestSeconds] = useState<number>(90);
  const [autoRest, setAutoRest] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [prefSaved, setPrefSaved] = useState(false);

  useEffect(() => {
    try {
      const storedRest = localStorage.getItem(REST_KEY);
      if (storedRest) setRestSeconds(Number(storedRest) || 90);
      const storedAuto = localStorage.getItem(AUTO_REST_KEY);
      if (storedAuto !== null) setAutoRest(storedAuto === 'true');
      const storedSound = localStorage.getItem(SOUND_KEY);
      if (storedSound !== null) setSoundEnabled(storedSound !== 'false');
    } catch {}

    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          clearCachedUser();
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          saveCachedUser(data.user);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleUpdateRest = (sec: number) => {
    setRestSeconds(sec);
    localStorage.setItem(REST_KEY, String(sec));
    showSavedFeedback();
  };

  const handleToggleAutoRest = () => {
    const next = !autoRest;
    setAutoRest(next);
    localStorage.setItem(AUTO_REST_KEY, String(next));
    showSavedFeedback();
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem(SOUND_KEY, String(next));
    showSavedFeedback();
  };

  const showSavedFeedback = () => {
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2000);
  };

  const handleLogout = async () => {
    try {
      clearCachedUser();
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-[#111111] flex flex-col pb-24 selection:bg-[#FF4A00] selection:text-white">
      <Header
        userWeight={user?.weightKg}
        userName={user?.name}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-10 py-8 sm:py-10 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight uppercase">
            Settings &amp; Preferences
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
            Customize workout timers, feedback audio, and system preferences.
          </p>
        </div>

        {/* Athlete Profile Summary Card */}
        <div className="nike-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-orange-50 text-[#FF4A00]">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 suppressHydrationWarning className="font-black text-lg text-zinc-900 uppercase">
                  {user?.name || 'Athlete Profile'}
                </h2>
                <p className="text-xs text-zinc-500 font-medium">
                  {user?.weightKg || 75} kg &bull; {user?.heightCm || 175} cm &bull; {user?.sex || 'unspecified'}
                </p>
              </div>
            </div>

            <Link
              href="/profile"
              className="py-2.5 px-5 rounded-full bg-[#111] hover:bg-[#222] text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
            >
              <span>Edit Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Workout & Timer Preferences */}
        <div className="nike-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-zinc-100 text-zinc-800">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-zinc-900 uppercase">Default Rest Timer</h2>
                <p className="text-xs text-zinc-500 font-medium">Auto-prompted countdown between sets</p>
              </div>
            </div>

            {prefSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-2.5">
            {[60, 90, 120, 180].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleUpdateRest(s)}
                className={`py-3 rounded-xl font-mono text-xs font-black uppercase transition-all ${
                  restSeconds === s
                    ? 'bg-[#111] text-white shadow-md'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200/70'
                }`}
              >
                {s >= 60 ? `${s / 60}m` : `${s}s`}
                <span className="block text-[9px] font-sans font-normal opacity-70">
                  {s === 60 ? 'Hypertrophy' : s === 90 ? 'Standard' : s === 120 ? 'Compound' : 'Heavy'}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-100 space-y-4">
            {/* Auto-start rest */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-zinc-900">Auto-start rest timer</p>
                <p className="text-xs text-zinc-500">Automatically trigger countdown when a set is marked complete</p>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoRest}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  autoRest ? 'bg-[#FF4A00]' : 'bg-zinc-200'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    autoRest ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Audio Feedback */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-bold text-zinc-900">Audio &amp; Vibration cues</p>
                <p className="text-xs text-zinc-500">Play timer completions and set check-in haptics</p>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  soundEnabled ? 'bg-[#FF4A00]' : 'bg-zinc-200'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Database Storage Information Card */}
        <div className="nike-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-zinc-100 text-zinc-800">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-900 uppercase">Cloud Workout Storage</h2>
              <p className="text-xs text-zinc-500 font-medium">Secure MongoDB Atlas Database</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
            All your workout logs, exercise sets, weights, reps, volume calculations, and custom split templates are persisted safely in the cloud with zero paywalls.
          </p>
        </div>

        {/* Log Out */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 px-6 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of STRYQ.</span>
          </button>
        </div>
      </main>
    </div>
  );
}
