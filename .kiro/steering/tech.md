# Technology Stack

## Frontend

- **Framework**: Next.js 14 with App Router and Server Components
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui (built on Radix UI primitives)
- **State Management**: Convex React hooks with optimistic updates
- **Fonts**: Geist Sans/Mono, Inter, Plus Jakarta Sans, Space Grotesk

## Backend

- **Database**: Convex (serverless, real-time NoSQL with WebSocket connections)
- **Authentication**: Convex Auth with OAuth providers (GitHub, Google)
- **API Layer**: Next.js API routes (App Router)
- **AI Integration**: Heroku Managed Inference (multi-model support)
- **MCP Tools**: Model Context Protocol for external resource access

## AI Models

- **GPT-OSS 120B**: General-purpose queries (default)
- **Nova Lite**: Fast responses for simple queries
- **Nova Pro**: Balanced performance and quality
- **Claude 4.5 Sonnet**: Complex reasoning and analysis

## Key Libraries

- `convex`: Real-time database client
- `@convex-dev/auth`: Authentication
- `ai`: Vercel AI SDK for streaming responses
- `@anthropic-ai/sdk`: Claude integration
- `openai`: OpenAI-compatible API client
- `react-big-calendar`: Calendar UI
- `@dnd-kit/*`: Drag-and-drop for Kanban
- `react-markdown`, `remark-gfm`, `rehype-highlight`: Markdown rendering
- `recharts`: Data visualization
- `zustand`: Client-side state management
- `nuqs`: URL state management
- `zod`: Schema validation
- `react-hook-form`: Form handling

## Development Tools

- **Package Manager**: pnpm 10.17.1+
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier with Tailwind plugin
- **Type Checking**: TypeScript 5.7+

## Common Commands

```bash
# Development (runs both frontend and backend)
pnpm dev

# Frontend only
pnpm dev:frontend

# Backend only (Convex)
pnpm dev:backend

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Convex commands
npx convex dev              # Start Convex dev server
npx convex deploy           # Deploy to production
npx convex env set KEY val  # Set environment variable
npx convex dashboard        # Open Convex dashboard
```

## Environment Variables

Required in `.env.local`:
- `CONVEX_DEPLOYMENT`: Convex deployment name
- `NEXT_PUBLIC_CONVEX_URL`: Convex API URL
- `HEROKU_INFERENCE_URL`: Heroku Inference base URL
- `HEROKU_INFERENCE_KEY_*`: API keys for AI models (at least one required)
- `NEXT_PUBLIC_APP_URL`: Application base URL

Optional:
- `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`: GitHub OAuth
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`: Google OAuth
- `VERCEL_ANALYTICS_ID`: Vercel Analytics

## Build System

- Next.js handles frontend bundling and optimization
- Convex handles backend deployment and schema migrations
- TypeScript compilation happens during build
- Tailwind CSS processes styles at build time
