import { IWorkoutDocument } from './models/Workout';
import { IUserDocument } from './models/User';
import { formatNumber } from './math';

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || '';
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete?: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
}

/**
 * Generates the Strava OAuth authorization URL.
 */
export function getStravaAuthUrl(state?: string): string {
  const redirectUri = `${APP_URL}/api/strava/callback`;
  const scope = 'activity:write,read';
  const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
  
  return `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&approval_prompt=auto&scope=${scope}${stateParam}`;
}

/**
 * Exchanges authorization code for Strava access & refresh tokens.
 */
export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange Strava token: ${errorText}`);
  }

  return response.json();
}

/**
 * Refreshes an expired Strava access token using the refresh token.
 */
export async function refreshStravaToken(refreshToken: string): Promise<StravaTokenResponse> {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh Strava token: ${errorText}`);
  }

  return response.json();
}

/**
 * Validates and gets a fresh Strava access token for a user.
 */
export async function getValidStravaAccessToken(user: IUserDocument): Promise<string> {
  if (!user.strava || !user.strava.accessToken) {
    throw new Error('Strava account is not connected');
  }

  const now = Math.floor(Date.now() / 1000);
  // If token expires in less than 5 minutes (300s), refresh it
  if (user.strava.expiresAt <= now + 300) {
    try {
      const refreshed = await refreshStravaToken(user.strava.refreshToken);
      user.strava.accessToken = refreshed.access_token;
      user.strava.refreshToken = refreshed.refresh_token;
      user.strava.expiresAt = refreshed.expires_at;
      await user.save();
    } catch (err) {
      console.error('Failed to auto-refresh Strava token:', err);
      // If refresh fails, try using existing token if not strictly expired
      if (user.strava.expiresAt <= now) {
        throw new Error('Strava authorization expired. Please reconnect Strava in Settings.');
      }
    }
  }

  return user.strava.accessToken;
}

/**
 * Builds the high-impact STRYQ session summary description for Strava activity.
 */
export function formatStravaDescription(workout: {
  title?: string;
  totalVolumeKg: number;
  caloriesBurned: number;
  durationSeconds: number;
  exercises: {
    name: string;
    sets: {
      setNumber: number;
      weightKg: number;
      reps: number;
      est1RM?: number;
      completed: boolean;
    }[];
  }[];
}): string {
  const lines: string[] = [];
  lines.push('⚡ STRYQ Session Summary');
  lines.push(`• Total Tonnage: ${formatNumber(workout.totalVolumeKg)} kg`);
  lines.push(`• Active Caloric Burn: ~${workout.caloriesBurned} kcal`);
  lines.push('');
  lines.push('Workouts Completed:');

  workout.exercises.forEach((exercise) => {
    const completedSets = exercise.sets.filter((s) => s.completed);
    if (completedSets.length === 0) return;

    lines.push(`🏋️ ${exercise.name} (${completedSets.length} set${completedSets.length > 1 ? 's' : ''}):`);

    completedSets.forEach((set) => {
      const est1RMText = set.est1RM && set.est1RM > 0 ? ` (Est. 1RM: ${set.est1RM} kg)` : '';
      lines.push(`  Set ${set.setNumber}: ${set.weightKg} kg × ${set.reps} reps${est1RMText}`);
    });
    lines.push('');
  });

  lines.push('🔥 Tracked with STRYQ PWA (https://stryq.app)');
  return lines.join('\n').trim();
}

/**
 * Uploads a completed workout session to Strava REST API.
 */
export async function postWorkoutToStrava(
  accessToken: string,
  workout: {
    title: string;
    durationSeconds: number;
    totalVolumeKg: number;
    caloriesBurned: number;
    exercises: any[];
    createdAt?: Date;
  }
): Promise<{ id: string | number; name: string }> {
  // If in demo/mock mode or without valid keys, simulate realistic Strava response
  if (accessToken.startsWith('mock_') || !process.env.STRAVA_CLIENT_ID || process.env.STRAVA_CLIENT_ID === 'mock_strava_client_id') {
    return {
      id: `mock_strava_${Date.now()}`,
      name: workout.title || 'STRYQ Strength Session',
    };
  }

  const startDate = (workout.createdAt ? new Date(workout.createdAt) : new Date()).toISOString();
  const description = formatStravaDescription(workout);

  const payload = {
    name: workout.title || 'STRYQ Strength Session',
    sport_type: 'WeightTraining',
    type: 'WeightTraining',
    start_date_local: startDate,
    elapsed_time: workout.durationSeconds,
    description: description,
    trainer: 0,
    commute: 0,
  };

  const response = await fetch('https://www.strava.com/api/v3/activities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Strava API returned status ${response.status}`);
  }

  return response.json();
}
