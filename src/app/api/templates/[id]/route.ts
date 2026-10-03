import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Template } from '@/lib/models/Template';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const template = await Template.findOne({ _id: id, userId: session.userId });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, category, notes, exercises } = body;

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (category) updateData.category = category.trim();
    if (notes !== undefined) updateData.notes = notes.trim();
    if (exercises && Array.isArray(exercises)) {
      updateData.exercises = exercises.map((ex: any) => ({
        name: ex.name,
        isCompound: Boolean(ex.isCompound),
        defaultSets: Number(ex.defaultSets) || (ex.sets?.length || 3),
        defaultWeightKg: Number(ex.defaultWeightKg) || (ex.sets?.[0]?.weightKg || 60),
        defaultReps: Number(ex.defaultReps) || (ex.sets?.[0]?.reps || 8),
      }));
    }

    const updated = await Template.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, template: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const deleted = await Template.findOneAndDelete({ _id: id, userId: session.userId });
    if (!deleted) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Template deleted from database' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
