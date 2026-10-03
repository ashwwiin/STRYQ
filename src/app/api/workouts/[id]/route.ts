import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Workout } from '@/lib/models/Workout';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = getSessionUser(req);
    const conn = await connectDB();

    if (conn && session && !id.startsWith('seed_') && !id.startsWith('offline_')) {
      const workout = await Workout.findById(id);
      if (!workout) {
        return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
      }
      return NextResponse.json({ workout });
    }

    return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conn = await connectDB();

    if (conn && !id.startsWith('seed_') && !id.startsWith('offline_')) {
      await Workout.findByIdAndDelete(id);
    }

    return NextResponse.json({ success: true, message: 'Workout deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
