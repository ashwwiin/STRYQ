import { NextRequest, NextResponse } from 'next/server';
import { getStravaAuthUrl } from '@/lib/strava';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionUser(req);
    const state = session?.userId || 'guest';
    const url = getStravaAuthUrl(state);
    return NextResponse.json({ url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
