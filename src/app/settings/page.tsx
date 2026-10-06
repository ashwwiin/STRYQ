'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import WeightQuickEditModal from '@/components/WeightQuickEditModal';
import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/storage';
import {
  User,
  Weight,
  CheckCircle2,
  LogOut,
  Save,
  Dumbbell,
  Shield,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [cached] = useState(() => getCachedUser());
  const [user, setUser] = useState<{ id?: string; name: string; email?: string; weightKg: number } | null>(cached);
  const [name, setName] = useState(cached?.name || '');
  const [weightKg, setWeightKg] = useState(cached?.weightKg || 75);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

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
          saveCachedUser(data.user);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, weightKg: Number(weightKg) || 75 }),
      });

      if (res.ok) {
        const updated = { ...(user || {}), name, weightKg: Number(weightKg) || 75 };
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
        onOpenWeightModal={() => setIsWeightModalOpen(true)}
        userName={user?.name}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 sm:px-10 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">Settings</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
            Manage your body weight calibration and athlete profile preferences.
          </p>
        </div>

        {/* Profile Card */}
        <div className="nike-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-orange-50 text-[#FF4A00]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-zinc-900 uppercase">Athlete Calibration</h2>
              <p className="text-xs text-zinc-500 font-medium">Body weight calibrates active MET calorie expenditure and relative strength</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block mb-1">
                  Athlete Name
                </label>
                <input
                  suppressHydrationWarning
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block mb-1">
                  Body Weight (kg)
                </label>
                <div className="relative">
                  <input
                    suppressHydrationWarning
                    type="number"
                    step="0.5"
                    min="30"
                    max="250"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 75)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white font-medium"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-400">
                    KG
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block mb-1">
                Email Address
              </label>
              <input
                suppressHydrationWarning
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-400 cursor-not-allowed font-medium"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Calibration saved
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="ml-auto py-3 px-8 rounded-full bg-[#111111] hover:bg-[#222222] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Database Storage Information Card */}
        <div className="nike-card p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-zinc-100 text-zinc-800">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-zinc-900 uppercase">Cloud Workout Storage</h2>
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

      <WeightQuickEditModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        currentWeight={user?.weightKg || 75}
        onSaveWeight={async (w) => {
          setWeightKg(w);
          await fetch('/api/auth/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weightKg: w }),
          });
        }}
      />
    </div>
  );
}
