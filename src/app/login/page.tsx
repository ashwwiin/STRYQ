'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/Logo';
import { Dumbbell, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [weightKg, setWeightKg] = useState(75);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const isRegister = tab === 'register';
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister
      ? { name, email, password, weightKg: Number(weightKg) || 75 }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@stryq.app', password: 'demopassword123' }),
      });
      if (res.ok) {
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-[#111111] flex flex-col justify-between selection:bg-[#FF4A00] selection:text-white">
      {/* Top Navbar */}
      <header className="w-full px-6 sm:px-12 lg:px-20 h-20 bg-white border-b border-zinc-100 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo size="md" variant="dark" />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Athletic Editorial Image */}
          <div className="hidden lg:block lg:col-span-7 relative h-[620px] rounded-3xl overflow-hidden shadow-xl">
            <Image
              src="/images/hero.jpg"
              alt="Strength training"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-10 text-white">
              <span className="text-xs font-black uppercase tracking-widest text-[#FF4A00] mb-2">
                STRYQ Training Club
              </span>
              <h2 className="text-4xl font-black tracking-tight text-white leading-none uppercase">
                Heavy Sets. <br />
                Complete Logs.
              </h2>
              <p className="text-sm text-zinc-300 mt-2 max-w-md font-medium">
                Accurate 1RM calculations, training calendar breakdown, active MET calories, and split routines with zero paywalls.
              </p>
            </div>
          </div>

          {/* Right Column: Clean Auth */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">
                {tab === 'login' ? 'Welcome Back.' : 'Join the Club.'}
              </h1>
              <p className="text-sm text-zinc-500 font-medium">
                {tab === 'login'
                  ? 'Sign in to access your workout calendar, history, and routines.'
                  : 'Start logging workouts with full set-by-set detail.'}
              </p>
            </div>

            {/* Tab Pill Switcher */}
            <div className="grid grid-cols-2 p-1.5 bg-zinc-100 rounded-full">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-full transition-all ${tab === 'login'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-full transition-all ${tab === 'register'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <>
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="Alex Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block mb-1.5">
                      Body Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="30"
                      max="250"
                      placeholder="75"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value) || 75)}
                      required
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="athlete@stryq.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-full bg-[#111111] hover:bg-[#222222] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-wider mt-4"
              >
                <span>{loading ? 'Authenticating...' : tab === 'login' ? 'Sign In' : 'Create Free Account'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 sm:px-12 py-6 border-t border-zinc-100 text-center text-xs text-zinc-400 font-bold uppercase tracking-wider">
        STRYQ. &bull; Engineered for Strength Athletes &bull; Workout Calendar &amp; Progression
      </footer>
    </div>
  );
}
