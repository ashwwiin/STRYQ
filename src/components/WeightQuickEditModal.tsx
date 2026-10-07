'use client';

import React, { useState } from 'react';
import { X, Check, Weight, Info } from 'lucide-react';

interface WeightQuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeight: number;
  onSaveWeight: (newWeight: number) => Promise<void>;
}

export default function WeightQuickEditModal({
  isOpen,
  onClose,
  currentWeight,
  onSaveWeight,
}: WeightQuickEditModalProps) {
  const [weight, setWeight] = useState<number>(currentWeight || 75);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleQuickAdd = (delta: number) => {
    setWeight((prev) => Math.max(30, Math.min(250, Math.round((prev + delta) * 10) / 10)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveWeight(weight);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#141417] border border-zinc-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-[#FF4A00]/20 text-[#FF4A00]">
              <Weight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Calibrate Weight</h3>
              <p className="text-xs text-zinc-400">Active MET calorie expenditure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center justify-center py-5 bg-zinc-900/80 rounded-2xl border border-zinc-800/80">
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                step="0.5"
                min="30"
                max="250"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                className="w-28 text-center text-4xl font-black bg-transparent text-[#FF4A00] focus:outline-none focus:ring-0 tracking-tight"
                autoFocus
              />
              <span className="text-xl font-bold text-zinc-500">KG</span>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => handleQuickAdd(-1)}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700 active:scale-95 text-zinc-200 shadow-sm transition"
              >
                -1.0 kg
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(-0.5)}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700 active:scale-95 text-zinc-200 shadow-sm transition"
              >
                -0.5 kg
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(0.5)}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700 active:scale-95 text-zinc-200 shadow-sm transition"
              >
                +0.5 kg
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(1)}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700 active:scale-95 text-zinc-200 shadow-sm transition"
              >
                +1.0 kg
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-orange-950/20 rounded-xl border border-orange-500/20 text-xs text-zinc-300">
            <Info className="w-4 h-4 text-[#FF4A00] shrink-0 mt-0.5" />
            <span>
              Accurate body weight calibrates exact Metabolic Equivalent of Task (MET) calorie expenditure and relative strength.
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border border-zinc-800 text-zinc-400 font-bold text-xs hover:bg-zinc-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || weight <= 0}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#FF4A00] hover:bg-[#E04200] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 active:scale-95 disabled:opacity-50 transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              {saving ? 'Saving...' : 'Save Calibration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
