# Mind's Eye - Azura Personal AI

## Overview
A personal, private AI interface called "Azura's Eye" (Mind's Eye). This app is designed to run locally on your device, connecting to your phone storage, files, projects, and local Termux terminal.

## Features
- **AI Chat Interface** - Text and voice input for communicating with Azura
- **Command Terminal** - Execute commands locally via Termux Bridge
- **Settings Vault** - Securely store API keys for GitHub, OpenAI, and search engines
- **Dashboard Grid** - Quick access to phone, files, stories, and projects
- **Local Processing** - Everything runs privately on your device

## Architecture

### Frontend (React + Vite)
- `client/src/pages/Home.tsx` - Main interface
- `client/src/components/AzuraAvatar.tsx` - Animated AI avatar
- `client/src/components/ChatInterface.tsx` - Chat input with voice support
- `client/src/components/CommandTerminal.tsx` - Termux bridge terminal
- `client/src/components/SettingsVault.tsx` - API key management
- `client/src/components/DashboardGrid.tsx` - Quick access dashboard

### Backend (Express + PostgreSQL)
- `server/routes.ts` - API endpoints for chat, commands, and settings
- `server/storage.ts` - Database operations using Drizzle ORM
- `shared/schema.ts` - Data models for messages, commands, API keys

### API Endpoints
- `GET/POST /api/chat/messages` - Chat history
- `GET/POST /api/commands/logs` - Command execution logs
- `GET/POST/DELETE /api/keys` - API key management
- `GET/POST /api/settings/:key` - App settings

## Converting to APK

To convert this web app to an Android APK:

1. **Build the production version:**
   ```bash
   npm run build
   ```

2. **Use a wrapper like:**
   - **Capacitor** - Run `npx cap add android` then build with Android Studio
   - **Cordova** - Wrap the dist folder
   - **PWA Builder** - Convert to a Progressive Web App
   - **WebView wrapper** - Create a simple Android app that loads the web interface

3. **For Termux integration:**
   - Run a WebSocket server in Termux that bridges commands
   - Configure the app's Termux Bridge settings with your local IP

## Development

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev

# Build for production
npm run build
```

## User Preferences
- Dark cyberpunk aesthetic with electric blue accents
- Futuristic fonts (Orbitron for display, Rajdhani for UI)
- Glassmorphic panels with backdrop blur
- Animated elements for "alive" feel
