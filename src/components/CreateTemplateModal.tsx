'use client';

import React, { useState } from 'react';
import AddExerciseModal, { ExerciseSelection } from '@/components/AddExerciseModal';
import { X, Plus, Trash2, Dumbbell, Sparkles, Check, BookmarkPlus, Layers, Search } from 'lucide-react';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSaved: () => void;
}

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onTemplateSaved,
}: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Push');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<
    { name: string; isCompound: boolean; defaultSets: number; defaultWeightKg: number; defaultReps: number }[]
  >([]);

  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Arms & Core', 'Custom'];

  const handleSelectExercise = (exercise: ExerciseSelection) => {
    setExercises((prev) => [
      ...prev,
      {
        name: exercise.name,
        isCompound: exercise.isCompound,
        defaultSets: 3,
        defaultWeightKg: exercise.defaultWeightKg || (exercise.isCompound ? 60 : 20),
        defaultReps: exercise.defaultReps || (exercise.isCompound ? 8 : 10),
      },
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index: number, field: string, value: any) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }
    if (exercises.length === 0) {
      setError('Please add at least one exercise to your routine');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          notes: notes.trim(),
          exercises,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save template');
      }

      onTemplateSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-[#141417] border border-zinc-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-orange-500/10 border border-[#FF4A00]/20 text-[#FF4A00]">
                <BookmarkPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-xl text-white uppercase tracking-tight">Create Workout Template</h3>
                <p className="text-xs text-zinc-400 font-medium">Save recurring split routines directly to your database</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="my-3 p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-bold text-center">
              {error}
            </div>
          )}

          {/* Scrollable Form */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
            {/* Template Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Heavy Push Power A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF4A00] focus:bg-black font-bold transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block mb-1">
                  Split Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#FF4A00] focus:bg-black font-bold transition-all cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-zinc-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Exercises in Routine ({exercises.length})
                </label>
              </div>

              <div className="space-y-2.5">
                {exercises.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/40 space-y-2">
                    <Dumbbell className="w-7 h-7 text-zinc-600 mx-auto stroke-[1.5]" />
                    <p className="text-xs text-zinc-400 font-medium">No movements added yet. Tap below to search all 800+ exercises.</p>
                  </div>
                )}

                {exercises.map((ex, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-900/60 rounded-2xl p-3.5 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 text-xs font-black flex items-center justify-center font-mono shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-white truncate">{ex.name}</span>
                      {ex.isCompound && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-orange-950/60 text-[#FF4A00] border border-orange-500/30 shrink-0">
                          Compound
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <div className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-xl border border-zinc-700/80 text-xs font-mono shadow-sm">
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={ex.defaultSets}
                          onChange={(e) => handleUpdateExercise(idx, 'defaultSets', parseInt(e.target.value, 10) || 1)}
                          className="w-7 text-center font-bold text-white bg-transparent focus:outline-none"
                        />
                        <span className="text-zinc-500">sets</span>
                      </div>

                      <div className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-xl border border-zinc-700/80 text-xs font-mono shadow-sm">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="500"
                          value={ex.defaultWeightKg}
                          onChange={(e) =>
                            handleUpdateExercise(idx, 'defaultWeightKg', parseFloat(e.target.value) || 0)
                          }
                          className="w-10 text-center font-bold text-[#FF4A00] bg-transparent focus:outline-none"
                        />
                        <span className="text-zinc-500">kg</span>
                      </div>

                      <div className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-xl border border-zinc-700/80 text-xs font-mono shadow-sm">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={ex.defaultReps}
                          onChange={(e) => handleUpdateExercise(idx, 'defaultReps', parseInt(e.target.value, 10) || 1)}
                          className="w-7 text-center font-bold text-white bg-transparent focus:outline-none"
                        />
                        <span className="text-zinc-500">reps</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(idx)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search & Add Exercise Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddExerciseOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-[#FF4A00] bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs font-black uppercase tracking-wider transition-all active:scale-[0.99] group shadow-sm"
                >
                  <Search className="w-4 h-4 text-[#FF4A00] group-hover:scale-110 transition-transform" />
                  <span>Search &amp; Add Exercise (800+ Movements)...</span>
                </button>
              </div>
            </div>

            {/* Notes Optional */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block mb-1">
                Routine Notes / Protocol (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 90s rest on compounds, 3 RIR target, superset lateral raises."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF4A00] focus:bg-black font-medium transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-full border border-zinc-800 text-zinc-400 font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 rounded-full bg-[#FF4A00] hover:bg-[#E04200] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-950/50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{saving ? 'Saving to Database...' : 'Save Template to DB'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 800+ Exercise Search and Select Modal */}
      <AddExerciseModal
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onSelectExercise={handleSelectExercise}
      />
    </>
  );
}
