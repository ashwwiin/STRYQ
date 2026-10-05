'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Plus, Dumbbell, Clock, AlertCircle } from 'lucide-react';

/* ───────────────────────── Types ───────────────────────── */

/* What the workout page receives when an exercise is picked */
export interface ExerciseSelection {
  name: string;
  isCompound: boolean;
  defaultWeightKg: number;
  defaultReps: number;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
}

interface ExerciseRecord {
  id: string;
  name: string;
  equipment: string; // barbell | dumbbell | machine | cable | bodyweight | kettlebell | other
  mechanic: 'compound' | 'isolation' | null;
  category: string | null;
  primary: string[];
  secondary: string[];
  level: string | null;
}

interface Prepared {
  e: ExerciseRecord;
  norm: string; // "barbell bench press medium grip"
  compact: string; // "barbellbenchpressmediumgrip" (so "pullup" finds "Pull-Up")
}

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseSelection) => void;
}

/* ───────────────────────── Data ─────────────────────────
   The list lives in /public/exercises.json (876 exercises) and is only downloaded
   the first time the picker opens. */

const DATA_URL = '/exercises.json';
const RECENT_KEY = 'stryq_recent_exercises';
const PAGE = 40;

let cache: Prepared[] | null = null;
let inflight: Promise<Prepared[]> | null = null;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function loadExercises(): Promise<Prepared[]> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch(DATA_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<ExerciseRecord[]>;
    })
    .then((list) => {
      cache = list.map((e) => {
        const n = norm(e.name);
        return { e, norm: n, compact: n.replace(/ /g, '') };
      });
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/* ───────────────────────── Filters ───────────────────────── */

const MUSCLE_GROUPS: { label: string; muscles: string[] }[] = [
  { label: 'Chest', muscles: ['chest'] },
  { label: 'Back', muscles: ['lats', 'middle back', 'lower back', 'traps'] },
  { label: 'Shoulders', muscles: ['shoulders', 'neck'] },
  { label: 'Arms', muscles: ['biceps', 'triceps', 'forearms'] },
  { label: 'Legs', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'] },
  { label: 'Core', muscles: ['abdominals'] },
];

const EQUIPMENT: { value: string; label: string }[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'other', label: 'Other' },
];

/* Shorthand people type */
const ALIASES: Record<string, string> = {
  db: 'dumbbell',
  dbs: 'dumbbell',
  bb: 'barbell',
  kb: 'kettlebell',
  ohp: 'overhead press',
  rdl: 'romanian deadlift',
  bw: 'bodyweight',
};

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function search(list: Prepared[], query: string): Prepared[] {
  const tokens = norm(query)
    .split(' ')
    .filter(Boolean)
    .flatMap((t) => (ALIASES[t] ? ALIASES[t].split(' ') : [t]));
  if (tokens.length === 0) return list;

  const phrase = tokens.join(' ');
  const scored: { p: Prepared; score: number }[] = [];

  for (const p of list) {
    let ok = true;
    let score = 0;
    for (const t of tokens) {
      if (p.norm.includes(t) || p.compact.includes(t)) {
        // Words that start with the token rank higher than matches in the middle of a word
        score += p.norm.split(' ').some((w) => w.startsWith(t)) ? 0 : 2;
      } else {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    if (p.norm === phrase) score -= 10;
    else if (p.norm.startsWith(phrase)) score -= 5;
    scored.push({ p, score });
  }

  scored.sort(
    (a, b) => a.score - b.score || a.p.norm.length - b.p.norm.length || a.p.norm.localeCompare(b.p.norm)
  );
  return scored.map((s) => s.p);
}

/* ───────────────────────── Component ───────────────────────── */

export default function AddExerciseModal({ isOpen, onClose, onSelectExercise }: AddExerciseModalProps) {
  const [all, setAll] = useState<Prepared[] | null>(cache);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [recent, setRecent] = useState<ExerciseSelection[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setError(false);
    loadExercises()
      .then(setAll)
      .catch(() => setError(true));
  }, []);

  // Load data and recents when the picker opens
  useEffect(() => {
    if (!isOpen) return;
    load();
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'));
    } catch {
      setRecent([]);
    }
    setQuery('');
    setMuscle(null);
    setEquipment(null);
    setLimit(PAGE);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen, load]);

  // Close with Escape, and stop the page behind from scrolling
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!all) return [];
    let list = search(all, query);
    if (muscle) {
      const group = MUSCLE_GROUPS.find((g) => g.label === muscle);
      if (group) list = list.filter((p) => p.e.primary.some((m) => group.muscles.includes(m)));
    }
    if (equipment) list = list.filter((p) => p.e.equipment === equipment);
    return list;
  }, [all, query, muscle, equipment]);

  useEffect(() => {
    setLimit(PAGE);
    listRef.current?.scrollTo({ top: 0 });
  }, [query, muscle, equipment]);

  const filtering = query.trim() !== '' || muscle !== null || equipment !== null;
  const exact = results.some((p) => p.norm === norm(query));

  const pick = (sel: ExerciseSelection) => {
    // Remember it for the "Recent" list
    try {
      const next = [sel, ...recent.filter((r) => r.name !== sel.name)].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    onSelectExercise(sel);
    onClose();
  };

  const pickRecord = (e: ExerciseRecord) =>
    pick({
      name: e.name,
      isCompound: e.mechanic === 'compound',
      defaultWeightKg: 0,
      defaultReps: e.mechanic === 'compound' ? 8 : 10,
      primaryMuscles: e.primary,
      secondaryMuscles: e.secondary,
    });

  const pickCustom = () => {
    const name = titleCase(query.trim().replace(/\s+/g, ' '));
    if (!name) return;
    pick({ name, isCompound: false, defaultWeightKg: 0, defaultReps: 10 });
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight > el.scrollHeight - 200 && limit < results.length) {
      setLimit((l) => l + PAGE);
    }
  };

  if (!isOpen) return null;

  const shown = results.slice(0, limit);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Add exercise">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm" />

      <div className="relative flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[80vh] sm:max-w-2xl sm:rounded-3xl">
        {/* Header + search */}
        <div className="space-y-3 border-b border-zinc-200 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black uppercase tracking-tight sm:text-xl">Add exercise</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) {
                  e.preventDefault();
                  pickRecord(results[0].e);
                }
              }}
              placeholder={all ? `Search ${all.length} exercises` : 'Search exercises'}
              className="w-full rounded-full bg-zinc-100 py-3 pl-11 pr-10 text-base font-medium text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
              aria-label="Search exercises"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-zinc-400 hover:text-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="-mx-4 space-y-2 px-4 sm:-mx-5 sm:px-5">
            <ChipRow
              label="Muscle"
              value={muscle}
              onChange={setMuscle}
              options={MUSCLE_GROUPS.map((g) => ({ value: g.label, label: g.label }))}
            />
            <ChipRow label="Equipment" value={equipment} onChange={setEquipment} options={EQUIPMENT} />
          </div>
        </div>

        {/* List */}
        <div ref={listRef} onScroll={onScroll} className="flex-1 overflow-y-auto overscroll-contain">
          {error && (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <AlertCircle className="h-8 w-8 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-600">Couldn&apos;t load the exercise list.</p>
              <button
                onClick={load}
                className="rounded-full bg-[#111] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white"
              >
                Try again
              </button>
            </div>
          )}

          {!error && !all && (
            <div className="space-y-2 p-4 sm:p-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-zinc-100" />
              ))}
            </div>
          )}

          {!error && all && (
            <>
              {/* Recent */}
              {!filtering && recent.length > 0 && (
                <section className="px-4 pt-4 sm:px-5">
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <Clock className="h-3.5 w-3.5" /> Recent
                  </h3>
                  <ul className="space-y-1">
                    {recent.map((r) => (
                      <li key={r.name}>
                        <Row
                          name={r.name}
                          sub={(r.primaryMuscles || []).map(titleCase).join(', ')}
                          compound={r.isCompound}
                          onClick={() => pick(r)}
                        />
                      </li>
                    ))}
                  </ul>
                  <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    All exercises
                  </h3>
                </section>
              )}

              <ul className="space-y-1 px-4 pb-4 sm:px-5 sm:pb-5">
                {!(!filtering && recent.length > 0) && <li className="h-3" aria-hidden />}
                {shown.map((p) => (
                  <li key={p.e.id}>
                    <Row
                      name={p.e.name}
                      sub={[p.e.primary.map(titleCase).join(', '), titleCase(p.e.equipment)]
                        .filter(Boolean)
                        .join(' · ')}
                      compound={p.e.mechanic === 'compound'}
                      onClick={() => pickRecord(p.e)}
                    />
                  </li>
                ))}

                {results.length > shown.length && (
                  <li>
                    <button
                      onClick={() => setLimit((l) => l + PAGE)}
                      className="w-full rounded-2xl py-3 text-xs font-bold text-[#FF4A00] hover:bg-orange-50"
                    >
                      Show more ({results.length - shown.length} left)
                    </button>
                  </li>
                )}

                {results.length === 0 && (
                  <li className="px-2 py-10 text-center text-sm text-zinc-500">
                    No exercises match{query.trim() ? ` “${query.trim()}”` : ' these filters'}.
                  </li>
                )}

                {/* Custom exercise */}
                {query.trim().length >= 2 && !exact && (
                  <li className="pt-2">
                    <button
                      onClick={pickCustom}
                      className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-zinc-300 p-3.5 text-left transition hover:border-zinc-900"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF4A00]">
                        <Plus className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-zinc-900">
                          Add “{query.trim()}” as a custom exercise
                        </span>
                        <span className="block text-xs text-zinc-500">Not in the list? Create your own.</span>
                      </span>
                    </button>
                  </li>
                )}
              </ul>
            </>
          )}
        </div>

        {all && (
          <div className="border-t border-zinc-200 px-4 py-2.5 text-center text-[11px] font-medium text-zinc-400 sm:px-5">
            {results.length} of {all.length} exercises
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Small components ───────────────────────── */

function Row({
  name,
  sub,
  compound,
  onClick,
}: {
  name: string;
  sub: string;
  compound: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-zinc-50 active:scale-[0.99]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#FF4A00]">
        <Dumbbell className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-zinc-900">{name}</span>
        {sub && <span className="block truncate text-xs text-zinc-500">{sub}</span>}
      </span>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${compound ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
          }`}
      >
        {compound ? 'Compound' : 'Isolation'}
      </span>
    </button>
  );
}

function ChipRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={`${label} filter`}>
      <span className="w-[72px] shrink-0 text-[11px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
      <Chip active={value === null} onClick={() => onChange(null)}>
        All
      </Chip>
      {options.map((o) => (
        <Chip key={o.value} active={value === o.value} onClick={() => onChange(value === o.value ? null : o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${active ? 'bg-[#111] text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
        }`}
    >
      {children}
    </button>
  );
}