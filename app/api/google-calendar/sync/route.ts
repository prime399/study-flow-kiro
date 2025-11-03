import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { cookies } from 'next/headers';
import { getGoogleAccessTokenDirect, decryptToken, createGoogleCalendarEvent } from '@/lib/google-calendar-direct';
import { enforceCalendarPermission, CalendarPermissionError } from '@/lib/google-calendar-permissions';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Google Calendar Sync Started ===');

    // Get Convex auth token from cookies
    const cookieStore = await cookies();
    const isLocalhost = request.headers.get('host')?.includes('localhost');
    const cookieName = isLocalhost ? '__convexAuthJWT' : '__Host-__convexAuthJWT';
    const convexAuthToken = cookieStore.get(cookieName)?.value;

    if (!convexAuthToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Create authenticated Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    }

    const convexClient = new ConvexHttpClient(convexUrl);
    convexClient.setAuth(convexAuthToken);

    // Check permission to create calendar events (required for sync)
    try {
      await enforceCalendarPermission(convexClient, 'create');
    } catch (error) {
      if (error instanceof CalendarPermissionError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    // Get Google Calendar tokens
    const tokens = await convexClient.query(api.googleCalendar.getTokens);
    if (!tokens) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }

    // Get access token (refresh if needed)
    const accessToken = await getGoogleAccessTokenDirect(convexClient);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to get access token' },
        { status: 400 }
      );
    }

    const calendarId = tokens.calendarId || 'primary';

    // Get recent study sessions
    const stats = await convexClient.query(api.study.getFullStats);
    if (!stats || !stats.recentSessions) {
      return NextResponse.json({
        success: true,
        message: 'No study sessions to sync'
      });
    }

    // Sync completed sessions that were created/updated recently
    let syncedCount = 0;
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const session of stats.recentSessions) {
      try {
        // Parse times - handle both number and string
        const sessionStartTime = typeof session.startTime === 'string' ? parseInt(session.startTime) : session.startTime;
        const sessionEndTime = session.endTime ? (typeof session.endTime === 'string' ? parseInt(session.endTime) : session.endTime) : null;

        // Only sync recently completed sessions
        if (session.completed && sessionEndTime && sessionEndTime > oneHourAgo) {
          const startTime = new Date(sessionStartTime);
          const endTime = new Date(sessionEndTime);
          const durationMinutes = Math.round((sessionEndTime - sessionStartTime) / 1000 / 60);

          const event = {
            summary: `Study Session - ${session.type}`,
            description: `Study session completed\nType: ${session.type}\nDuration: ${durationMinutes} minutes`,
            start: {
              dateTime: startTime.toISOString(),
              timeZone: 'UTC',
            },
            end: {
              dateTime: endTime.toISOString(),
              timeZone: 'UTC',
            },
            colorId: '2', // Green color
          };

          await createGoogleCalendarEvent(accessToken, calendarId, event);
          syncedCount++;
          console.log(`Synced study session: ${session.type}`);
        }
      } catch (error) {
        console.error(`Failed to sync session:`, error);
        // Continue with next session on error
      }
    }

    // Update last sync time
    await convexClient.mutation(api.googleCalendar.updateLastSyncTime);

    console.log(`=== Google Calendar Sync Complete - Synced ${syncedCount} sessions ===`);

    return NextResponse.json({
      success: true,
      syncedCount,
      message: `Synced ${syncedCount} study session(s) to Google Calendar`,
    });
  } catch (error: any) {
    console.error('Error syncing to Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar', details: error.message },
      { status: 500 }
    );
  }
}
