import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Initialize Auth0 with enhanced configuration for AI agent integration
export const auth0 = new Auth0Client({
  authorizationParameters: {
    // Request specific scopes for AI agent functionality
    scope: process.env.AUTH0_SCOPE || 'openid profile email offline_access read:user update:user',
    // Set audience for API access (required for access tokens)
    audience: process.env.AUTH0_AUDIENCE,
  },
  session: {
    // Enable rolling sessions for better security
    rolling: true,
    // Absolute duration of the session (7 days)
    absoluteDuration: 60 * 60 * 24 * 7,
    // Inactivity duration (1 day)
    inactivityDuration: 60 * 60 * 24,
  },
});

// Helper to get access token with automatic refresh
export const getAccessToken = async () => {
  try {
    const tokenResult = await auth0.getAccessToken();

    if (!tokenResult || !tokenResult.token) {
      throw new Error('No access token found in Auth0 session');
    }

    return {
      token: tokenResult.token,
      expiresAt: tokenResult.expiresAt,
    };
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

// Helper to get refresh token for delegation
export const getRefreshToken = async () => {
  try {
    const session = await auth0.getSession();
    
    if (!session?.refreshToken) {
      throw new Error('No refresh token found in session');
    }

    return session.refreshToken;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    throw error;
  }
};

// Helper to get user session
export const getUser = async () => {
  try {
    const session = await auth0.getSession();
    return session?.user || null;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
};

// Helper to update user session with custom data
// For App Router (Server Actions, Route Handlers)
export const updateUserSession = async (
  customData: Record<string, any>
) => {
  try {
    const session = await auth0.getSession();
    
    if (!session) {
      throw new Error('No active session to update');
    }

    await auth0.updateSession({
      ...session,
      user: {
        ...session.user,
        ...customData,
      },
    });

    return true;
  } catch (error) {
    console.error('Error updating session:', error);
    return false;
  }
};
