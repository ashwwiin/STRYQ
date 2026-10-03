'use client';

import React from 'react';
import { X, Heart, Activity, ArrowRight, Zap } from 'lucide-react';

interface AppleHealthGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppleHealthGuideModal({ isOpen, onClose }: AppleHealthGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-red-50 text-red-500">
              <Heart className="w-5 h-5 fill-red-500/20" />
            </div>
            <div>
              <h3 className="font-black text-lg text-zinc-900">Apple Health Ring Sync</h3>
              <p className="text-xs text-zinc-500">Direct background handshake</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagram */}
        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
          <div className="flex items-center justify-between text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF4A00] flex items-center justify-center font-black text-sm">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold mt-1 text-zinc-800">STRYQ.</span>
              <span className="text-[9px] text-zinc-400">1RM / MET</span>
            </div>

            <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />

            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FC4C02] flex items-center justify-center font-black text-sm">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold mt-1 text-zinc-800">Strava</span>
              <span className="text-[9px] text-zinc-400">REST API</span>
            </div>

            <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />

            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center font-black text-sm">
                <Heart className="w-5 h-5 fill-red-500/20" />
              </div>
              <span className="text-[11px] font-bold mt-1 text-zinc-800">HealthKit</span>
              <span className="text-[9px] text-zinc-400">Move Rings</span>
            </div>
          </div>
        </div>

        {/* 3 Step instructions */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            30-Second One-Time Setup:
          </h4>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
            <div className="w-6 h-6 rounded-full bg-orange-100 text-[#FF4A00] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs text-zinc-700">
              <p className="font-bold text-zinc-900">Connect Strava in STRYQ</p>
              <p className="text-zinc-500 mt-0.5">Authorize STRYQ to post strength sessions to your Strava profile.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
            <div className="w-6 h-6 rounded-full bg-orange-100 text-[#FF4A00] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs text-zinc-700">
              <p className="font-bold text-zinc-900">Enable Health Access in Strava iOS</p>
              <p className="text-zinc-500 mt-0.5">
                Open <strong>Strava</strong> on your iPhone &gt; <strong>Settings ⚙️</strong> &gt; <strong>Applications, Services and Devices</strong> &gt; <strong>Health</strong> &gt; Toggle <strong>Send to Health</strong> on.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs text-zinc-700">
              <p className="font-bold text-zinc-900">Auto-Close Rings on Every Lift</p>
              <p className="text-zinc-500 mt-0.5">
                Every STRYQ session automatically credits active calories to your Apple Watch Move, Exercise & Calorie rings.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-2xl bg-[#FF4A00] hover:bg-[#e04000] text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all"
        >
          Got It, Let&apos;s Lift
        </button>
      </div>
    </div>
  );
}
