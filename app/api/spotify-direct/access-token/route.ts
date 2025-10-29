import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchQuery, fetchAction, fetchMutation } from 'convex/nextjs';
import { decryptToken, encryptToken } from '@/lib/spotify-direct';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get tokens from Convex
    const tokens = await fetchQuery(api.spotify.getTokens);

    if (!tokens) {
      return NextResponse.json(
        { error: 'Not connected to Spotify' },
        { status: 401 }
      );
    }

    // Decrypt tokens
    let accessToken = decryptToken(tokens.accessToken);
    const refreshToken = decryptToken(tokens.refreshToken);

    // Check if token is expired (with 5 minute buffer)
    const isExpired = tokens.expiresAt < Date.now() + 5 * 60 * 1000;

    if (isExpired) {
      // Refresh the token
      const refreshed = await fetchAction(api.spotify.refreshAccessToken, {
        refreshToken,
      });

      // Encrypt and update tokens in Convex
      await fetchMutation(api.spotify.updateAccessToken, {
        accessToken: encryptToken(refreshed.accessToken),
        refreshToken: encryptToken(refreshed.refreshToken),
        expiresAt: refreshed.expiresAt,
        scope: refreshed.scope,
        tokenType: refreshed.tokenType,
      });

      accessToken = refreshed.accessToken;
    }

    return NextResponse.json({
      accessToken,
      expiresAt: tokens.expiresAt,
    });
  } catch (error: any) {
    console.error('Error getting Spotify access token:', error);
    return NextResponse.json(
      { error: 'Failed to get access token', details: error.message },
      { status: 500 }
    );
  }
}
