import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { decryptToken, getCurrentUserProfileDirect } from '@/lib/spotify-direct';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tokens = await fetchQuery(api.spotify.getTokens);

    if (!tokens) {
      return NextResponse.json({
        connected: false,
        hasToken: false,
      });
    }

    // Decrypt access token
    const accessToken = decryptToken(tokens.accessToken);

    // Check if token is expired
    const isExpired = tokens.expiresAt < Date.now();

    if (isExpired) {
      // Token needs refresh - let the client handle it
      return NextResponse.json({
        connected: true,
        hasToken: true,
        tokenExpired: true,
      });
    }

    // Get user profile from Spotify
    try {
      const profile = await getCurrentUserProfileDirect(accessToken);

      return NextResponse.json({
        connected: true,
        hasToken: true,
        tokenExpired: false,
        profile: {
          id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
          images: profile.images,
          product: profile.product,
        },
      });
    } catch (profileError) {
      // Failed to get profile - token might be invalid
      return NextResponse.json({
        connected: true,
        hasToken: true,
        tokenExpired: true,
      });
    }
  } catch (error) {
    console.error('Error checking Spotify status:', error);
    return NextResponse.json(
      { error: 'Failed to check Spotify status' },
      { status: 500 }
    );
  }
}
