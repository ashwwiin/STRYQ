'use client';

import React, { useState } from 'react';
import { STANDARD_EXERCISES, StandardExercise } from '@/lib/exercises';
import { X, Plus, Trash2, Dumbbell, Sparkles, Check, BookmarkPlus, Layers } from 'lucide-react';

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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Arms & Core', 'Custom'];

  const handleAddExercise = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    if (!selectedName) return;

    const standard = STANDARD_EXERCISES.find((ex) => ex.name === selectedName);
    if (standard) {
      setExercises((prev) => [
        ...prev,
        {
          name: standard.name,
          isCompound: standard.isCompound,
          defaultSets: 3,
          defaultWeightKg: standard.defaultWeightKg || 50,
          defaultReps: standard.defaultReps || 8,
        },
      ]);
    } else {
      setExercises((prev) => [
        ...prev,
        {
          name: selectedName,
          isCompound: false,
          defaultSets: 3,
          defaultWeightKg: 20,
          defaultReps: 10,
        },
      ]);
    }
    e.target.value = '';
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
      setError('Please add at least one exercise');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-orange-50 text-[#FF4A00]">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-xl text-zinc-900 uppercase tracking-tight">Create Workout Template</h3>
              <p className="text-xs text-zinc-500 font-medium">Save recurring split routines directly to your database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* Scrollable Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Template Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block mb-1">
                Template Name
              </label>
              <input
                type="text"
                placeholder="e.g. Heavy Push Power A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block mb-1">
                Split Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:bg-white font-bold"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exercise List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-700">
                Exercises in Routine ({exercises.length})
              </label>
            </div>

            <div className="space-y-2.5">
              {exercises.length === 0 && (
                <div className="text-center py-6 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
                  <p className="text-xs text-zinc-400 font-medium">No movements added yet. Select an exercise below to add to routine.</p>
                </div>
              )}
              {exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-700 text-xs font-black flex items-center justify-center font-mono shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-zinc-900 truncate">{ex.name}</span>
                    {ex.isCompound && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-orange-100 text-[#FF4A00]">
                        Compound
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-zinc-200 text-xs font-mono">
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={ex.defaultSets}
                        onChange={(e) => handleUpdateExercise(idx, 'defaultSets', parseInt(e.target.value, 10) || 1)}
                        className="w-7 text-center font-bold text-zinc-900 focus:outline-none"
                      />
                      <span className="text-zinc-400">sets</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-zinc-200 text-xs font-mono">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="500"
                        value={ex.defaultWeightKg}
                        onChange={(e) =>
                          handleUpdateExercise(idx, 'defaultWeightKg', parseFloat(e.target.value) || 0)
                        }
                        className="w-10 text-center font-bold text-[#FF4A00] focus:outline-none"
                      />
                      <span className="text-zinc-400">kg</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-zinc-200 text-xs font-mono">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={ex.defaultReps}
                        onChange={(e) => handleUpdateExercise(idx, 'defaultReps', parseInt(e.target.value, 10) || 1)}
                        className="w-7 text-center font-bold text-zinc-900 focus:outline-none"
                      />
                      <span className="text-zinc-400">reps</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(idx)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Dropdown */}
            <div className="pt-1">
              <select
                onChange={handleAddExercise}
                defaultValue=""
                className="w-full bg-white border border-dashed border-zinc-300 hover:border-zinc-900 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-700 cursor-pointer focus:outline-none"
              >
                <option value="" disabled>
                  + Add Exercise to Routine...
                </option>
                {STANDARD_EXERCISES.map((ex) => (
                  <option key={ex.id} value={ex.name}>
                    {ex.name} ({ex.muscleGroup} • {ex.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes Optional */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-zinc-700 block mb-1">
              Routine Notes / Protocol (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 90s rest on compounds, 3 RIR target, superset lateral raises."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-full border border-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3.5 rounded-full bg-[#FF4A00] hover:bg-[#e04000] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{saving ? 'Saving to Database...' : 'Save Template to DB'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
