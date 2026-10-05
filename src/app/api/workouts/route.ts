import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Workout } from '@/lib/models/Workout';
import { getSessionUser } from '@/lib/auth';
import { calculateCalories, calculateTotalVolume, calculate1RM } from '@/lib/math';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ workouts: [] });
    }

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ workouts: [] });
    }

    const workouts = await Workout.find({ userId: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ workouts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to save workouts.' }, { status: 401 });
    }

    const body = await req.json();
    const { title, durationSeconds, exercises, userWeightKg, createdAt } = body;

    const formattedExercises = (exercises || []).map((ex: any) => ({
      name: ex.name,
      isCompound: Boolean(ex.isCompound),
      sets: (ex.sets || []).map((s: any, idx: number) => ({
        setNumber: s.setNumber || idx + 1,
        weightKg: Number(s.weightKg) || 0,
        reps: Number(s.reps) || 0,
        est1RM: calculate1RM(Number(s.weightKg) || 0, Number(s.reps) || 0),
        completed: Boolean(s.completed),
      })),
    }));

    const totalVolume = calculateTotalVolume(formattedExercises);
    const caloriesBurned = calculateCalories(
      durationSeconds || 0,
      userWeightKg || 75,
      formattedExercises
    );

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 503 });
    }

    const workoutDoc: any = {
      userId: session.userId,
      title: title || 'STRYQ Strength Session',
      durationSeconds: durationSeconds || 0,
      totalVolumeKg: totalVolume,
      caloriesBurned,
      exercises: formattedExercises,
      syncedToStrava: false,
    };

    if (createdAt) {
      workoutDoc.createdAt = new Date(createdAt);
    }

    const savedWorkout = await Workout.create(workoutDoc);

    return NextResponse.json({
      success: true,
      workout: savedWorkout,
    });
  } catch (error: any) {
    console.error('Save workout error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save workout' }, { status: 500 });
  }
}
