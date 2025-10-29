import { auth0 } from '@/lib/auth0';
import { getSpotifyAccessToken, getCurrentUserProfile } from '@/lib/spotify';
import { NextResponse } from 'next/server';
import { AccessTokenForConnectionError } from '@auth0/nextjs-auth0/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if user has an Auth0 session
    const session = await auth0.getSession();

    if (!session) {
      // No Auth0 session = Spotify not connected
      return NextResponse.json(
        { connected: false, error: 'No Auth0 session' },
        { status: 200 }
      );
    }

    try {
      const accessToken = await getSpotifyAccessToken();

      const profile = await getCurrentUserProfile(accessToken);

      return NextResponse.json({
        connected: true,
        profile: {
          id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
          images: profile.images,
          product: profile.product,
        },
        hasToken: true,
      });
    } catch (error: any) {
      console.error('Error fetching Spotify token:', error);

      if (error instanceof AccessTokenForConnectionError) {
        return NextResponse.json(
          {
            connected: false,
            error: error.message,
            errorCode: error.code,
          },
          { status: 200 }
        );
      }

      if (error.message?.includes('No connection token found')) {
        return NextResponse.json(
          { connected: false, error: 'Spotify not connected' },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { connected: false, error: 'Failed to verify Spotify connection' },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Error in Spotify token endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
