import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Workout } from '@/lib/models/Workout';
import { getSessionUser } from '@/lib/auth';
import { getValidStravaAccessToken, postWorkoutToStrava } from '@/lib/strava';

export async function POST(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    const body = await req.json();
    const { workoutId, workoutData } = body;

    const conn = await connectDB();
    let workoutToSync = workoutData;
    let workoutDoc = null;

    if (workoutId && conn) {
      workoutDoc = await Workout.findById(workoutId);
      if (workoutDoc) {
        workoutToSync = workoutDoc.toObject();
      }
    }

    if (!workoutToSync) {
      return NextResponse.json({ error: 'Workout data is required for Strava sync' }, { status: 400 });
    }

    let accessToken = 'mock_access_token_demo';

    if (session && conn && !session.userId.startsWith('demo_')) {
      const user = await User.findById(session.userId);
      if (user && user.strava?.accessToken) {
        try {
          accessToken = await getValidStravaAccessToken(user);
        } catch (authErr: any) {
          return NextResponse.json({ error: authErr.message || 'Strava auth error' }, { status: 401 });
        }
      }
    }

    // Post to Strava
    const stravaRes = await postWorkoutToStrava(accessToken, workoutToSync);

    // Update workout in DB if saved
    if (workoutDoc) {
      workoutDoc.syncedToStrava = true;
      workoutDoc.stravaActivityId = stravaRes.id?.toString();
      await workoutDoc.save();
    }

    return NextResponse.json({
      success: true,
      stravaActivityId: stravaRes.id,
      message: 'Successfully synced session to Strava & Apple Health ecosystem',
    });
  } catch (error: any) {
    console.error('Strava sync error:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync with Strava' }, { status: 500 });
  }
}
