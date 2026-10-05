'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Dumbbell, Settings } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on active workout page since active workout has its own dedicated dock
  if (pathname === '/workout/active') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-zinc-200 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-4">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/dashboard' || pathname === '/'
              ? 'text-[#FF4A00] font-bold'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </Link>

        {/* Calendar */}
        <Link
          href="/calendar"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/calendar'
              ? 'text-[#FF4A00] font-bold'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Calendar</span>
        </Link>

        {/* Start Workout Primary CTA Button */}
        <Link
          href="/workout/active"
          className="flex flex-col items-center -mt-5 group"
        >
          <div className="w-12 h-12 p-3 rounded-full bg-[#FF4A00] text-white shadow-lg shadow-orange-600/30 flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform">
            <Dumbbell className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-[#FF4A00] tracking-tight mt-1">Start Lift</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            pathname === '/settings'
              ? 'text-[#FF4A00] font-bold'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Settings</span>
        </Link>
      </div>
    </div>
  );
}
