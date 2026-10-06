'use client';

import React, { useEffect, useState } from 'react';

/* Minimum time the splash stays up, and how long the exit takes */
const MIN_VISIBLE_MS = 2200;
const EXIT_MS = 700;

const WORD = ['S', 'T', 'R', 'Y', 'Q', '.'];
const LETTER_DELAY_MS = 110; // stagger between letters
const LETTER_START_MS = 250; // before the first letter appears

type Phase = 'show' | 'exit' | 'gone';

/**
 * Full-screen launch splash.
 *
 * Renders on the server too (so there is no flash of the dashboard on a cold
 * open). Server and first client render are identical (phase 'show'), so there
 * is no hydration mismatch. Lives in the root layout, so it only appears on a
 * full load or app launch, never on in-app navigation.
 */
export default function SplashScreen() {
    const [phase, setPhase] = useState<Phase>('show');

    // Lock scrolling behind the splash
    useEffect(() => {
        if (phase === 'gone') return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [phase]);

    // Leave after the minimum time AND once the page has finished loading
    useEffect(() => {
        const start = Date.now();
        let timer: ReturnType<typeof setTimeout> | undefined;

        const begin = () => {
            const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - start));
            timer = setTimeout(() => setPhase('exit'), wait);
        };

        if (document.readyState === 'complete') {
            begin();
        } else {
            window.addEventListener('load', begin, { once: true });
        }

        return () => {
            window.removeEventListener('load', begin);
            if (timer) clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        if (phase !== 'exit') return;
        const t = setTimeout(() => setPhase('gone'), EXIT_MS);
        return () => clearTimeout(t);
    }, [phase]);

    if (phase === 'gone') return null;

    const exiting = phase === 'exit';

    return (
        <div
            aria-hidden
            className="stryq-splash fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#09090b] text-white"
            style={{
                transform: exiting ? 'translateY(-100%)' : 'translateY(0)',
                transition: `transform ${EXIT_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`,
                pointerEvents: exiting ? 'none' : 'auto',
            }}
        >
            <style>{`
        @keyframes stryq-letter {
          0%   { opacity: 0; transform: translateY(110%) rotate(6deg); filter: blur(8px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) rotate(0); filter: blur(0); }
        }
        @keyframes stryq-dot {
          0%   { opacity: 0; transform: translateY(110%) scale(0.4); }
          70%  { opacity: 1; transform: translateY(-6%) scale(1.25); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes stryq-line {
          0%   { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes stryq-fade-up {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .stryq-splash *, .stryq-splash { animation: none !important; }
          .stryq-splash [data-anim] { opacity: 1 !important; transform: none !important; filter: none !important; }
        }
      `}</style>

            {/* Wordmark, letter by letter */}
            <div className="relative flex flex-col items-center">
                <h1 className="flex overflow-hidden py-2 text-[4.5rem] font-black uppercase leading-none tracking-tighter sm:text-[8rem]">
                    {WORD.map((ch, i) => {
                        const isDot = ch === '.';
                        return (
                            <span
                                key={i}
                                data-anim
                                className={`inline-block ${ch === 'Q' || isDot ? 'text-[#FF4A00]' : 'text-white'}`}
                                style={{
                                    opacity: 0,
                                    animation: `${isDot ? 'stryq-dot' : 'stryq-letter'} 700ms cubic-bezier(0.22, 1, 0.36, 1) ${LETTER_START_MS + i * LETTER_DELAY_MS
                                        }ms both`,
                                }}
                            >
                                {ch}
                            </span>
                        );
                    })}
                </h1>

                {/* Underline sweep */}
                <span
                    data-anim
                    className="mt-1 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-[#FF4A00] via-[#FF4A00]/60 to-transparent"
                    style={{
                        transform: 'scaleX(0)',
                        animation: `stryq-line 800ms cubic-bezier(0.22, 1, 0.36, 1) ${LETTER_START_MS + WORD.length * LETTER_DELAY_MS
                            }ms both`,
                    }}
                />

                <p
                    data-anim
                    className="mt-5 text-[10px] font-bold uppercase tracking-[0.32em] text-zinc-400 sm:text-xs"
                    style={{
                        opacity: 0,
                        animation: `stryq-fade-up 600ms ease-out ${LETTER_START_MS + WORD.length * LETTER_DELAY_MS + 250}ms both`,
                    }}
                >
                    High velocity strength tracking
                </p>
            </div>
        </div>
    );
}