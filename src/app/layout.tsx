import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'STRYQ. — High Velocity Strength Tracking',
  description: 'Clean strength tracking Progressive Web App with 1RM computation and direct Strava / Apple Health sync.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.svg',
    apple: '/icons/icon-192x192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#FF4A00',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#fafafa] text-zinc-900">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-[#fafafa] text-zinc-900 antialiased flex flex-col font-sans selection:bg-[#FF4A00] selection:text-white">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
