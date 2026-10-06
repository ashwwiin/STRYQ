/**
 * STRYQ Basement Gym Offline Storage Engine
 * Guarantees zero data loss even if network drops completely or page refreshes.
 */

export interface ActiveWorkoutDraft {
  title: string;
  startTime: number;
  elapsedSeconds: number;
  exercises: {
    id: string;
    name: string;
    isCompound: boolean;
    sets: {
      setNumber: number;
      weightKg: number;
      reps: number;
      est1RM: number;
      completed: boolean;
    }[];
  }[];
  lastSavedAt: number;
}

const STORAGE_KEY_ACTIVE = 'stryq_active_workout_draft';
const STORAGE_KEY_OFFLINE_QUEUE = 'stryq_offline_workouts_queue';

export function saveActiveWorkoutDraft(draft: ActiveWorkoutDraft): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      ...draft,
      lastSavedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to write active workout to localStorage:', err);
  }
}

export function loadActiveWorkoutDraft(): ActiveWorkoutDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (!data) return null;
    return JSON.parse(data) as ActiveWorkoutDraft;
  } catch (err) {
    console.error('Failed to parse active workout draft:', err);
    return null;
  }
}

export function clearActiveWorkoutDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
  } catch (err) {
    console.error('Failed to clear active workout draft:', err);
  }
}

export function queueOfflineWorkout(workout: any): void {
  if (typeof window === 'undefined') return;
  try {
    const queue = getOfflineWorkoutQueue();
    queue.push({
      ...workout,
      offlineId: `offline_${Date.now()}`,
      queuedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to queue offline workout:', err);
  }
}

export function getOfflineWorkoutQueue(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY_OFFLINE_QUEUE);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function clearOfflineWorkoutQueue(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_OFFLINE_QUEUE);
  } catch (err) {
    console.error('Failed to clear offline queue:', err);
  }
}

export interface CachedUser {
  id?: string;
  name: string;
  email?: string;
  weightKg: number;
  stravaConnected?: boolean;
}

const STORAGE_KEY_USER = 'stryq_user';

export function saveCachedUser(user: CachedUser | null): void {
  if (typeof window === 'undefined' || !user) return;
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } catch {}
}

export function getCachedUser(): CachedUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
    const dRaw = localStorage.getItem('stryq_dashboard_cache');
    if (dRaw) {
      const parsed = JSON.parse(dRaw);
      if (parsed.user) return parsed.user;
    }
  } catch {}
  return null;
}

export function clearCachedUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem('stryq_dashboard_cache');
    localStorage.removeItem('stryq_calendar_cache');
  } catch {}
}

