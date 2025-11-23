# Project Structure

## Directory Organization

```
StudyFlow/
├── app/                    # Next.js App Router
│   ├── (protected)/       # Protected routes (requires auth)
│   │   └── dashboard/     # Main application features
│   │       ├── ai-helper/ # MentorMind AI assistant
│   │       ├── study/     # Study timer and analytics
│   │       ├── todos/     # Task management
│   │       ├── groups/    # Study groups and messaging
│   │       ├── calendar/  # Calendar integration
│   │       ├── settings/  # User settings and integrations
│   │       └── leaderboards/ # Competitive features
│   ├── api/               # API routes
│   │   ├── ai-helper/     # AI assistant endpoints
│   │   ├── google-calendar/ # Calendar integration
│   │   ├── spotify/       # Music integration
│   │   └── ...
│   ├── signin/            # Authentication pages
│   └── ...                # Root layout, globals, etc.
├── components/            # Reusable React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   └── ...               # Feature-specific components
├── convex/               # Backend (Convex)
│   ├── _generated/       # Auto-generated types
│   ├── schema.ts         # Database schema
│   ├── auth.ts           # Authentication functions
│   ├── study.ts          # Study session management
│   ├── groups.ts         # Group management
│   └── ...               # Other backend functions
├── lib/                  # Utility functions and shared logic
├── hooks/                # Custom React hooks
├── store/                # Client-side state (Zustand)
└── public/              # Static assets
```

## Routing Conventions

- **Route Groups**: `(protected)` for authenticated routes
- **Dynamic Routes**: `[groupId]` for parameterized paths
- **Private Components**: `_components` folders for route-specific components
- **Private Hooks**: `_hooks` folders for route-specific hooks
- **Private Constants**: `_constants.ts` for route-specific constants
- **Private Lib**: `_lib` folders for route-specific utilities

## File Naming

- **Components**: PascalCase for files, kebab-case for folders
  - `components/ui/button.tsx`
  - `app/(protected)/dashboard/ai-helper/_components/chat-input.tsx`
- **Utilities**: kebab-case
  - `lib/utils.ts`
  - `lib/google-calendar-direct.ts`
- **Convex Functions**: camelCase
  - `convex/study.ts`
  - `convex/googleCalendar.ts`
- **API Routes**: kebab-case folders with `route.ts`
  - `app/api/ai-helper/route.ts`

## Component Organization

- **Page Components**: Located in `app/` directory, use `"use client"` when needed
- **Shared Components**: In `components/` root
- **UI Primitives**: In `components/ui/` (shadcn/ui)
- **Feature Components**: In `_components` folders next to pages
- **Layout Components**: `layout.tsx` files in route folders

## Backend Organization (Convex)

- **Schema**: Single `schema.ts` file with all table definitions
- **Functions**: Organized by feature (study, groups, todos, etc.)
- **Queries**: Read-only operations
- **Mutations**: Write operations
- **Actions**: External API calls (HTTP requests)
- **HTTP Routes**: In `http.ts` for webhooks and external integrations

## State Management

- **Server State**: Convex queries/mutations (primary)
- **Client State**: Zustand stores for UI state (Spotify, Tops display)
- **URL State**: `nuqs` for shareable/bookmarkable state
- **Form State**: `react-hook-form` with Zod validation

## Import Aliases

- `@/*`: Root directory alias
  - `@/components/ui/button`
  - `@/lib/utils`
  - `@/convex/_generated/api`

## Key Architectural Patterns

- **Server Components First**: Use client components only when needed
- **Optimistic Updates**: Convex handles optimistic UI updates automatically
- **Real-time Subscriptions**: Convex queries auto-update on data changes
- **Type Safety**: Full TypeScript coverage with generated Convex types
- **API Routes**: Used for external integrations (AI, OAuth, webhooks)
- **Protected Routes**: Wrapped in authentication checks via Convex Auth
