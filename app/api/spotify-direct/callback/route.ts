import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens, encryptToken } from '@/lib/spotify-direct';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle user denial
    if (error === 'access_denied') {
      const returnTo = '/dashboard/settings';
      return NextResponse.redirect(
        new URL(`${returnTo}?spotify_error=access_denied`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?spotify_error=no_code', request.url)
      );
    }

    // Verify state for CSRF protection
    const cookieStore = await cookies();
    const storedState = cookieStore.get('spotify_auth_state')?.value;
    const returnTo = cookieStore.get('spotify_return_to')?.value || '/dashboard/settings';

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?spotify_error=invalid_state', request.url)
      );
    }

    // Clear state cookies
    cookieStore.delete('spotify_auth_state');
    cookieStore.delete('spotify_return_to');

    // Build redirect URI
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const redirectUri = `${protocol}://${host}/api/spotify-direct/callback`;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Encrypt tokens before storing
    const encryptedTokens = {
      accessToken: encryptToken(tokens.accessToken),
      refreshToken: encryptToken(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      scope: tokens.scope,
      tokenType: tokens.tokenType,
    };

    // Store in Convex using fetchMutation
    await fetchMutation(api.spotify.storeTokens, encryptedTokens);

    // Redirect back to settings with success message
    return NextResponse.redirect(
      new URL(`${returnTo}?spotify_connected=true`, request.url)
    );
  } catch (error) {
    console.error('Error handling Spotify callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?spotify_error=callback_failed', request.url)
    );
  }
}
