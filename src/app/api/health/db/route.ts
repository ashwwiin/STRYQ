import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function GET() {
  try {
    const conn = await connectDB();
    if (conn && conn.connection.readyState === 1) {
      return NextResponse.json({
        status: 'connected',
        databaseName: conn.connection.name,
        host: conn.connection.host,
        message: 'MongoDB is successfully connected and operational!',
      });
    }

    return NextResponse.json(
      {
        status: 'disconnected',
        message: 'Could not establish MongoDB connection. Please verify MONGODB_URI in .env.local',
      },
      { status: 503 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: err.message,
      },
      { status: 500 }
    );
  }
}
