'use client';

import React, { useState } from 'react';
import { STANDARD_EXERCISES, StandardExercise } from '@/lib/exercises';
import { Search, Plus, X, Dumbbell } from 'lucide-react';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: { name: string; isCompound: boolean; defaultWeightKg: number; defaultReps: number }) => void;
}

export default function AddExerciseModal({
  isOpen,
  onClose,
  onSelectExercise,
}: AddExerciseModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customIsCompound, setCustomIsCompound] = useState(false);
  const [customWeight, setCustomWeight] = useState(20);
  const [customReps, setCustomReps] = useState(10);

  if (!isOpen) return null;

  const categories = ['All', 'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight'];

  const filteredExercises = STANDARD_EXERCISES.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (ex: StandardExercise) => {
    onSelectExercise({
      name: ex.name,
      isCompound: ex.isCompound,
      defaultWeightKg: ex.defaultWeightKg,
      defaultReps: ex.defaultReps,
    });
    onClose();
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onSelectExercise({
      name: customName.trim(),
      isCompound: customIsCompound,
      defaultWeightKg: customWeight || 20,
      defaultReps: customReps || 10,
    });
    setCustomName('');
    setIsCreatingCustom(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-50 text-[#FF4A00]">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-zinc-900">Movement Library</h3>
              <p className="text-xs text-zinc-500">Select standard lift or create custom</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Category Filter */}
        <div className="py-3 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search movement (e.g. Bench, Squat, Row)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#FF4A00] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#FF4A00] text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Form or Exercise List */}
        {isCreatingCustom ? (
          <form onSubmit={handleCreateCustom} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-4 my-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900">New Custom Movement</span>
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="text-xs text-zinc-500 hover:text-zinc-800"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Exercise Name</label>
              <input
                type="text"
                placeholder="e.g. Romanian Deadlift w/ Chains"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#FF4A00]"
              />
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-200">
              <div>
                <span className="text-xs font-bold text-zinc-900">Compound Movement?</span>
                <p className="text-[11px] text-zinc-500">Compounds apply 5.5 MET calorie burn</p>
              </div>
              <button
                type="button"
                onClick={() => setCustomIsCompound(!customIsCompound)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  customIsCompound ? 'bg-[#FF4A00] text-white' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {customIsCompound ? 'Compound' : 'Isolation'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Default Weight (kg)</label>
                <input
                  type="number"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-sm text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Default Reps</label>
                <input
                  type="number"
                  value={customReps}
                  onChange={(e) => setCustomReps(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-sm text-zinc-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#FF4A00] hover:bg-[#e04000] text-white font-bold text-sm rounded-xl shadow-md active:scale-95"
            >
              Add Custom Movement to Session
            </button>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
            {filteredExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => handleSelect(ex)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-50 hover:bg-orange-50/50 border border-zinc-200 hover:border-[#FF4A00]/50 text-left transition-all group active:scale-[0.99]"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 group-hover:text-[#FF4A00] transition-colors">
                      {ex.name}
                    </span>
                    {ex.isCompound && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#FF4A00]">
                        Compound
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{ex.category}</span>
                    <span>&bull;</span>
                    <span>{ex.muscleGroup}</span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 group-hover:bg-[#FF4A00] group-hover:text-white flex items-center justify-center text-zinc-500 transition-colors shrink-0 shadow-sm">
                  <Plus className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        {!isCreatingCustom && (
          <div className="pt-3 border-t border-zinc-100">
            <button
              onClick={() => setIsCreatingCustom(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#FF4A00]" />
              <span>Create Custom Movement</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
