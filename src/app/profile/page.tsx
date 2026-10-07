'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/storage';
import {
  User,
  Weight,
  Ruler,
  CheckCircle2,
  Save,
  Dumbbell,
  Shield,
  Sparkles,
  Activity,
  ArrowRight,
  Settings as SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
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

  const [name, setName] = useState(cached?.name || '');
  const [weightKg, setWeightKg] = useState(cached?.weightKg || 75);
  const [sex, setSex] = useState(cached?.sex || 'unspecified');
  const [heightCm, setHeightCm] = useState(cached?.heightCm || 175);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
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
          setName(data.user.name || '');
          setWeightKg(data.user.weightKg || 75);
          setSex(data.user.sex || 'unspecified');
          setHeightCm(data.user.heightCm || 175);
          saveCachedUser(data.user);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const payload = {
      name: name.trim(),
      weightKg: Number(weightKg) || 75,
      sex,
      heightCm: Number(heightCm) || 175,
    };

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = { ...(user || {}), ...payload };
        setUser(updated as any);
        saveCachedUser(updated as any);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Helper conversions
  const lbs = Math.round(Number(weightKg) * 2.20462);
  const totalInches = Math.round(Number(heightCm) / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col pb-24 selection:bg-[#FF4A00] selection:text-white">
      <Header
        userWeight={user?.weightKg}
        userName={user?.name}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-10 py-8 sm:py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
              Athlete Profile
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
              Calibrate your physical metrics for accurate metabolic expenditure and strength calculations.
            </p>
          </div>

          <Link
            href="/settings"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-[#141417] border border-zinc-800/80 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xl">
          <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-6">
            <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-orange-500/10 border border-[#FF4A00]/20 text-2xl font-black text-[#FF4A00] shadow-md">
              <span suppressHydrationWarning>{(name || 'A').charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 suppressHydrationWarning className="font-black text-xl text-white tracking-tight uppercase">
                {name || 'STRYQ Athlete'}
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                {user?.email || 'Authenticated STRYQ Lifter'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Athlete Name */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block mb-2">
                  Athlete Full Name
                </label>
                <input
                  suppressHydrationWarning
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Vance"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF4A00] focus:bg-black font-medium transition-all"
                />
              </div>

              {/* Sex / Gender */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block mb-2">
                  Sex
                </label>
                <select
                  suppressHydrationWarning
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#FF4A00] focus:bg-black font-medium transition-all cursor-pointer"
                >
                  <option value="unspecified" className="bg-zinc-900 text-white">Select / Unspecified</option>
                  <option value="male" className="bg-zinc-900 text-white">Male</option>
                  <option value="female" className="bg-zinc-900 text-white">Female</option>
                  <option value="other" className="bg-zinc-900 text-white">Other</option>
                </select>
              </div>

              {/* Height */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">
                    Height (cm)
                  </label>
                  <span className="text-[11px] font-bold text-zinc-500 font-mono">
                    ≈ {feet}&apos;{inches}&quot;
                  </span>
                </div>
                <div className="relative">
                  <input
                    suppressHydrationWarning
                    type="number"
                    step="1"
                    min="50"
                    max="280"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || 175)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#FF4A00] focus:bg-black font-medium transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-500">
                    CM
                  </span>
                </div>
              </div>

              {/* Body Weight */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">
                    Body Weight (kg)
                  </label>
                  <span className="text-[11px] font-bold text-zinc-500 font-mono">
                    ≈ {lbs} lbs
                  </span>
                </div>
                <div className="relative">
                  <input
                    suppressHydrationWarning
                    type="number"
                    step="0.5"
                    min="20"
                    max="300"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 75)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-[#FF4A00] font-black focus:outline-none focus:border-[#FF4A00] focus:bg-black transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-500">
                    KG
                  </span>
                </div>
              </div>
            </div>

            {/* Read-only account credential */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block mb-2">
                Registered Email Address
              </label>
              <input
                suppressHydrationWarning
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 py-3.5 text-sm text-zinc-500 cursor-not-allowed font-medium"
              />
            </div>

            {/* Additional Metrics / Future Athlete Attributes */}
            <div className="pt-2 border-t border-zinc-800/80">
              <div className="rounded-2xl bg-zinc-900/60 p-4 sm:p-5 border border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF4A00]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Calibrated Calculations
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Your height ({heightCm} cm) and body weight ({weightKg} kg) are actively used across STRYQ algorithms to calculate real-time metabolic equivalent of task (MET) energy expenditure, relative bodyweight tonnage, and estimated 1RM scores.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              {saveSuccess ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Profile calibration saved
                </span>
              ) : (
                <div />
              )}
              <button
                type="submit"
                disabled={saving}
                className="py-3.5 px-8 rounded-full bg-[#FF4A00] hover:bg-[#E04200] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 shadow-lg shadow-orange-950/50 disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
