'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Weight, Settings, LogOut, LayoutGrid, Dumbbell, Calendar, ChevronDown } from 'lucide-react';

interface HeaderProps {
  userWeight?: number;
  onOpenWeightModal?: () => void;
  userName?: string;
  stravaConnected?: boolean;
}

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/workout/active', label: 'Workout', icon: Dumbbell, live: true },
];

export default function Header({
  userWeight = 75,
  onOpenWeightModal,
  userName = 'Athlete',
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDropdownOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-200/70">
      <div className="mx-auto relative flex h-16 w-full max-w-[1920px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-12 2xl:px-16">
        {/* Left: logo */}
        <div className="flex items-center gap-1">
          <Link href="/" className="flex items-center" aria-label="STRYQ home">
            <Logo size="md" variant="dark" />
          </Link>
        </div>

        {/* Center: segmented pill nav */}
        <nav
          aria-label="Main"
          className="flex items-center gap-1 rounded-full bg-zinc-100 p-1 md:absolute md:left-1/2 md:-translate-x-1/2"
        >
          {NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-bold transition-all sm:px-5 ${active
                  ? 'bg-[#111] text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-white hover:text-zinc-900'
                  }`}
              >
                {item.live && !active ? (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF4A00] opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF4A00]" />
                  </span>
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className={active ? '' : 'hidden sm:inline'}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white p-1 transition hover:border-zinc-400 sm:pr-3"
            >
              <span className="relative grid h-8 w-8 place-items-center rounded-full bg-[#111] text-xs font-black text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-[110px] truncate text-xs font-bold text-zinc-900 lg:inline">
                {userName}
              </span>
              <ChevronDown
                className={`hidden h-3.5 w-3.5 text-zinc-500 transition-transform sm:block ${dropdownOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {dropdownOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]"
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#111] text-sm font-black text-white">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-zinc-900">{userName}</p>
                    <p className="text-xs text-zinc-500">STRYQ Lifter</p>
                  </div>
                </div>

                <div className="my-1 h-px bg-zinc-100" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenWeightModal?.();
                  }}
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
                >
                  <Weight className="h-4 w-4 text-[#FF4A00]" />
                  Body weight: {userWeight} kg
                </button>

                <Link
                  href="/settings"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
                >
                  <Settings className="h-4 w-4 text-zinc-400" />
                  Settings &amp; Profile
                </Link>

                <button
                  onClick={handleLogout}
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>
  );
}