import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Template } from '@/lib/models/Template';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ templates: [] });
    }

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ templates: [] });
    }

    const templates = await Template.find({ userId: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Fetch templates error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to save templates.' }, { status: 401 });
    }

    const body = await req.json();
    const { name, category, notes, exercises } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json({ error: 'At least one exercise is required for a template' }, { status: 400 });
    }

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 503 });
    }

    const formattedExercises = exercises.map((ex: any) => ({
      name: ex.name,
      isCompound: Boolean(ex.isCompound),
      defaultSets: Number(ex.defaultSets) || (ex.sets?.length || 3),
      defaultWeightKg: Number(ex.defaultWeightKg) || (ex.sets?.[0]?.weightKg || 60),
      defaultReps: Number(ex.defaultReps) || (ex.sets?.[0]?.reps || 8),
    }));

    const newTemplate = await Template.create({
      userId: session.userId,
      name: name.trim(),
      category: category ? category.trim() : 'Custom',
      notes: notes ? notes.trim() : '',
      exercises: formattedExercises,
    });

    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: 'Workout template saved successfully to database',
    });
  } catch (error: any) {
    console.error('Save template error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save template' }, { status: 500 });
  }
}
