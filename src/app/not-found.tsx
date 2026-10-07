'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center">
      <Logo size="lg" variant="white" />
      <h1 className="text-4xl font-black uppercase mt-6 mb-2 text-white tracking-tight">404 - Page Not Found</h1>
      <p className="text-sm text-zinc-400 max-w-sm mb-6 font-medium">
        The training station or page you are looking for does not exist.
      </p>
      <Link
        href="/dashboard"
        className="px-8 py-3.5 rounded-full bg-[#FF4A00] hover:bg-[#E04200] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-950/50 transition-all"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
