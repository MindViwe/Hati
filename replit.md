# Hati - AI Chat Application

## Overview

Hati is a personal AI assistant application built for a user named Azura. It features a mystical, premium-themed chat interface powered by OpenAI through Replit's AI Integrations. The application includes text-based AI conversations, image generation capabilities, and a terminal interface for command execution. The app is password-protected with a simple authentication flow.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and UI effects
- **Build Tool**: Vite with custom path aliases (@/, @shared/, @assets/)

The frontend uses a protected route pattern where authentication state is stored in localStorage. The design follows a dark, mystical theme with purple/magenta accent colors and custom fonts (Cinzel, Playfair Display, Space Grotesk).

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under /api/* prefix
- **Streaming**: Server-Sent Events (SSE) for real-time AI chat responses

The server registers routes through a modular integration system located in `server/replit_integrations/`. Routes are organized by feature: chat, audio, and image generation.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` with models in `shared/models/`
- **Migrations**: Managed through Drizzle Kit (`db:push` command)
- **Tables**: 
  - `conversations` - Chat session metadata
  - `messages` - Individual chat messages with role (user/assistant)
  - `projects` - Code snippets and project storage
  - `songs` - Lyrics and song content

### Authentication
Simple password-based authentication using a hardcoded password ("azura") or environment variable `APP_PASSWORD`. No session tokens - authentication state is stored client-side in localStorage.

### AI Integration Pattern
The application uses Replit's AI Integrations which proxy to OpenAI. Configuration requires:
- `AI_INTEGRATIONS_OPENAI_API_KEY` - API key for AI services
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Replit's proxy endpoint

Chat responses stream via SSE to provide real-time text generation. Image generation uses the `gpt-image-1` model endpoint.

### Build Process
- **Development**: `tsx` runs TypeScript directly with Vite dev server
- **Production**: Custom build script (`script/build.ts`) uses esbuild for server and Vite for client
- **Output**: Server bundles to `dist/index.cjs`, client to `dist/public/`

## External Dependencies

### Database
- **PostgreSQL**: Required via `DATABASE_URL` environment variable
- **Drizzle ORM**: Query builder and schema management
- **connect-pg-simple**: Session storage (available but not currently used)

### AI Services
- **OpenAI API**: Accessed through Replit AI Integrations proxy
  - Chat completions for conversational AI
  - Image generation (gpt-image-1 model)
  - Speech-to-text and text-to-speech capabilities (audio integration available)

### UI Components
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-styled component library built on Radix
- **Lucide React**: Icon library
- **React Syntax Highlighter**: Code display in projects view

### Development Tools
- **Vite**: Frontend dev server and bundler with HMR
- **Replit Vite Plugins**: Runtime error overlay, cartographer, dev banner
- **esbuild**: Server-side bundling for production