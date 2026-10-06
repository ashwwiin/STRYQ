import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
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
      });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        weightKg: user.weightKg || 75,
        sex: user.sex || 'unspecified',
        heightCm: user.heightCm || 175,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { weightKg, name, sex, heightCm } = await req.json();

    const conn = await connectDB();
    if (conn) {
      const updateData: any = {};
      if (typeof weightKg === 'number' && weightKg >= 20 && weightKg <= 300) {
        updateData.weightKg = weightKg;
      }
      if (name && typeof name === 'string' && name.trim()) {
        updateData.name = name.trim();
      }
      if (sex && typeof sex === 'string') {
        updateData.sex = sex.trim();
      }
      if (typeof heightCm === 'number' && heightCm >= 50 && heightCm <= 280) {
        updateData.heightCm = heightCm;
      }

      await User.findByIdAndUpdate(session.userId, { $set: updateData });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      weightKg,
      name,
      sex,
      heightCm,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
