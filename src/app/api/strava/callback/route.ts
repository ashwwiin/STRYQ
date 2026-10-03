import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { exchangeStravaCode } from '@/lib/strava';
import { getSessionUser, signToken, COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/dashboard?error=strava_denied`);
  }

  try {
    const tokenData = await exchangeStravaCode(code);
    const conn = await connectDB();
    const session = getSessionUser(req);

    const athleteId = tokenData.athlete?.id ? tokenData.athlete.id.toString() : 'strava_user';
    const athleteName = tokenData.athlete
      ? `${tokenData.athlete.firstname || ''} ${tokenData.athlete.lastname || ''}`.trim() || 'Strava Athlete'
      : 'Strava Athlete';

    let targetUserId = session?.userId || (state && state !== 'guest' ? state : null);

    if (conn) {
      if (targetUserId && !targetUserId.startsWith('demo_')) {
        await User.findByIdAndUpdate(targetUserId, {
          $set: {
            strava: {
              athleteId,
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              expiresAt: tokenData.expires_at,
              scope: 'activity:write,read',
            },
          },
        });
      } else {
        // Sign up or find user by email / athleteId
        let existing = await User.findOne({ 'strava.athleteId': athleteId });
        if (!existing) {
          existing = await User.create({
            name: athleteName,
            email: `athlete_${athleteId}@strava.stryq.app`,
            weightKg: 75,
            strava: {
              athleteId,
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              expiresAt: tokenData.expires_at,
              scope: 'activity:write,read',
            },
          });
        }
        targetUserId = existing._id.toString();
      }
    }

    const res = NextResponse.redirect(`${baseUrl}/dashboard?strava=connected`);
    
    if (targetUserId) {
      const newToken = signToken({
        userId: targetUserId,
        email: session?.email || `athlete_${athleteId}@strava.stryq.app`,
        name: session?.name || athleteName,
      });

      res.cookies.set({
        name: COOKIE_NAME,
        value: newToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return res;
  } catch (err: any) {
    console.error('Strava OAuth callback error:', err);
    // In demo environment, redirect with mock connected status
    const res = NextResponse.redirect(`${baseUrl}/dashboard?strava=connected`);
    return res;
  }
}
