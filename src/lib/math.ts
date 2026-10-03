/**
 * STRYQ Mathematical & Algorithmic Engines
 * 
 * 1. 1-Rep Max (1RM) Estimator (Epley Equation):
 *    1RM = w * (1 + r / 30)
 *    where w is weight in kg, r is reps. If r = 1, 1RM = w.
 * 
 * 2. Dynamic Metabolic Calorie Expenditure (MET Formula):
 *    Calories Burned (kcal) = Duration (hours) * MET * Body Weight (kg)
 *    - Compound Sessions (Squat, Bench, Deadlift, OHP): MET = 5.5
 *    - Isolation / Accessory Work: MET = 3.8
 *    - Circuit / High-Volume Training: MET = 6.0
 */

export interface SetData {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  est1RM?: number;
}

export interface ExerciseData {
  id?: string;
  name: string;
  isCompound: boolean;
  sets: SetData[];
}

/**
 * Calculates estimated 1-Rep Max using the Epley Equation.
 * @param weightKg Weight lifted in kg
 * @param reps Repetitions completed
 * @returns Estimated 1RM in kg (rounded to 1 decimal place)
 */
export function calculate1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weightKg * 10) / 10;
  const est = weightKg * (1 + reps / 30);
  return Math.round(est * 10) / 10;
}

/**
 * Checks if an exercise is considered a major compound movement.
 */
export function isCompoundLift(exerciseName: string): boolean {
  const normalized = exerciseName.toLowerCase();
  return (
    normalized.includes('squat') ||
    normalized.includes('bench') ||
    normalized.includes('deadlift') ||
    normalized.includes('overhead press') ||
    normalized.includes('ohp') ||
    normalized.includes('military press') ||
    normalized.includes('barbell row') ||
    normalized.includes('pull-up') ||
    normalized.includes('chin-up') ||
    normalized.includes('dip')
  );
}

/**
 * Calculates MET coefficient for a given workout structure.
 */
export function determineMET(exercises: ExerciseData[]): number {
  if (!exercises || exercises.length === 0) return 4.0;

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
  const compoundExercises = exercises.filter(ex => ex.isCompound || isCompoundLift(ex.name));

  // If high volume (> 18 total completed sets), mark as high-volume training
  if (totalSets >= 18) {
    return 6.0;
  }

  // If session contains compound movements
  if (compoundExercises.length > 0) {
    return 5.5;
  }

  // Isolation / accessory work
  return 3.8;
}

/**
 * Calculates active metabolic caloric expenditure.
 * @param durationSeconds Duration of workout in seconds
 * @param bodyWeightKg Athlete body weight in kg (default 75kg)
 * @param exercises List of completed exercises
 */
export function calculateCalories(
  durationSeconds: number,
  bodyWeightKg: number = 75,
  exercises: ExerciseData[] = []
): number {
  if (durationSeconds <= 0 || bodyWeightKg <= 0) return 0;
  const durationHours = durationSeconds / 3600;
  const met = determineMET(exercises);
  const calories = durationHours * met * bodyWeightKg;
  return Math.round(calories);
}

/**
 * Calculates total tonnage (volume) lifted: sum(weightKg * reps) for completed sets.
 */
export function calculateTotalVolume(exercises: ExerciseData[]): number {
  let volume = 0;
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (set.completed && set.weightKg > 0 && set.reps > 0) {
        volume += set.weightKg * set.reps;
      }
    }
  }
  return Math.round(volume);
}

/**
 * Formats seconds into HH:MM:SS or MM:SS.
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const paddedMins = mins.toString().padStart(2, '0');
  const paddedSecs = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

/**
 * Formats number with commas (e.g., 4,820 kg)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
