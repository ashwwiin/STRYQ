'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, History, Settings, Dumbbell } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on active workout page since active workout has its own dedicated dock
  if (pathname === '/workout/active') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-lg border-t border-zinc-800/80 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-4">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/dashboard' || pathname === '/'
              ? 'text-amber-500 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </Link>

        {/* Start Workout Primary CTA Button */}
        <Link
          href="/workout/active"
          className="flex flex-col items-center -mt-5 group"
        >
          <div className="w-13 h-13 p-3 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-black shadow-lg shadow-amber-500/30 flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform">
            <Dumbbell className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-amber-500 tracking-tight mt-1">Start Lift</span>
        </Link>

        {/* Settings / Strava Link */}
        <Link
          href="/settings"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/settings'
              ? 'text-amber-500 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Settings</span>
        </Link>
      </div>
    </div>
  );
}
