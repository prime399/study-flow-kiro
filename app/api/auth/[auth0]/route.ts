import { auth0 } from '@/lib/auth0-config';

// Export dynamic route to handle all Auth0 authentication routes
// This includes: /api/auth/login, /api/auth/callback, /api/auth/logout, /api/auth/me
export const GET = auth0.handleAuth();
