import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col items-center justify-center p-6 text-center">
      <Logo size="lg" variant="dark" />
      <h1 className="text-4xl font-black uppercase mt-6 mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-zinc-500 max-w-sm mb-6 font-medium">
        The training station or page you are looking for does not exist.
      </p>
      <Link
        href="/dashboard"
        className="px-8 py-3.5 rounded-full bg-[#111111] hover:bg-[#222222] text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
