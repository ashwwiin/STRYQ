import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Workout } from '@/lib/models/Workout';
import { Template } from '@/lib/models/Template';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json(
        { user: null, workouts: [], templates: [] },
        { status: 401 }
      );
    }

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({
        user: {
          id: session.userId,
          name: session.name,
          email: session.email,
          weightKg: 75,
        },
        workouts: [],
        templates: [],
      });
    }

    // Execute queries concurrently using lean() for maximum performance
    const [userDoc, workouts, templates] = await Promise.all([
      User.findById(session.userId).select('name email weightKg sex heightCm').lean(),
      Workout.find({ userId: session.userId }).sort({ createdAt: -1 }).lean(),
      Template.find({ userId: session.userId }).sort({ createdAt: -1 }).lean(),
    ]);

    const user = userDoc
      ? {
          id: userDoc._id.toString(),
          name: userDoc.name,
          email: userDoc.email,
          weightKg: userDoc.weightKg || 75,
          sex: userDoc.sex || 'unspecified',
          heightCm: userDoc.heightCm || 175,
        }
      : {
          id: session.userId,
          name: session.name,
          email: session.email,
          weightKg: 75,
          sex: 'unspecified',
          heightCm: 175,
        };

    return NextResponse.json({
      user,
      workouts: workouts || [],
      templates: templates || [],
    });
  } catch (error: any) {
    console.error('Dashboard API aggregation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
