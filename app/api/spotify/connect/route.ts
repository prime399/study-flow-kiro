import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const returnTo = searchParams.get('returnTo') || '/dashboard/settings';

    // Redirect to Auth0 login with Spotify connection
    // This will initiate Auth0 OAuth flow with Spotify as the identity provider
    const loginUrl = new URL('/api/auth/login', request.url);
    loginUrl.searchParams.set('connection', 'spotify');
    loginUrl.searchParams.set('returnTo', returnTo);
    
    // IMPORTANT: Request offline_access to get refresh token
    loginUrl.searchParams.set('access_type', 'offline');
    loginUrl.searchParams.set('prompt', 'consent');

    return NextResponse.redirect(loginUrl.toString());
  } catch (error) {
    console.error('Error initiating Spotify connection:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Spotify connection' },
      { status: 500 }
    );
  }
}
