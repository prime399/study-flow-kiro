import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await fetchMutation(api.spotify.deleteTokens);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Spotify:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Spotify' },
      { status: 500 }
    );
  }
}
