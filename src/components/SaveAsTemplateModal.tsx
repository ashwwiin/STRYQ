'use client';

import React, { useState } from 'react';
import { X, BookmarkPlus, Check } from 'lucide-react';

interface SaveAsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutTitle: string;
  exercises: {
    name: string;
    isCompound: boolean;
    sets: { setNumber: number; weightKg: number; reps: number; completed: boolean }[];
  }[];
  onSuccess?: () => void;
}

export default function SaveAsTemplateModal({
  isOpen,
  onClose,
  workoutTitle,
  exercises,
  onSuccess,
}: SaveAsTemplateModalProps) {
  const [templateName, setTemplateName] = useState(workoutTitle || 'Custom Split Routine');
  const [category, setCategory] = useState('Push');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Arms & Core', 'Custom'];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    setSaving(true);
    setError(null);

    const formattedExercises = exercises.map((ex) => {
      const avgWeight = ex.sets.length > 0 ? ex.sets[0].weightKg : 60;
      const avgReps = ex.sets.length > 0 ? ex.sets[0].reps : 8;
      return {
        name: ex.name,
        isCompound: ex.isCompound,
        defaultSets: ex.sets.length || 3,
        defaultWeightKg: avgWeight || 60,
        defaultReps: avgReps || 8,
      };
    });

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          category,
          notes: notes.trim(),
          exercises: formattedExercises,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save template to database');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#141417] border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-[#FF4A00]/20 text-[#FF4A00]">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white uppercase tracking-tight">Save as Template</h3>
              <p className="text-xs text-zinc-400 font-medium">Store routine into your MongoDB database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF4A00] focus:bg-black font-bold transition"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF4A00] focus:bg-black font-bold transition cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-zinc-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 text-xs space-y-1">
            <span className="font-bold text-zinc-200 block">Exercises included ({exercises.length}):</span>
            <p className="text-zinc-400 truncate">
              {exercises.map((e) => e.name).join(', ')}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full border border-zinc-800 text-zinc-400 font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 rounded-full bg-[#FF4A00] hover:bg-[#E04200] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-orange-950/50 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{saving ? 'Saving...' : 'Save to DB'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
