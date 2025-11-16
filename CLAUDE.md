# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a self-hosted status page monitoring system built with Next.js 15, TypeScript, and PostgreSQL. It monitors HTTP endpoints at configurable intervals and displays uptime statistics on a public status page. The system uses server-side cron jobs (node-cron) for active monitoring.

## Development Commands

```bash
# Install dependencies
npm install

# Database setup
npx prisma migrate dev --name init  # Create database tables
npx prisma generate                 # Generate Prisma Client
npx prisma studio                   # Open database GUI

# Development
npm run dev                         # Start dev server at http://localhost:3000

# Production
npm run build                       # Build for production
npm start                           # Start production server

# Code quality
npm run lint                        # Run ESLint
```

## Environment Setup

Required environment variables (`.env`):
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_ADMIN_PASSWORD`: Password for admin portal access

The admin portal uses a simple password check (client-side) stored in `NEXT_PUBLIC_ADMIN_PASSWORD`. This is NOT production-ready authentication.

## Architecture

### Database Schema (Prisma)

**Three main models:**

1. **Endpoint** - Monitored services
   - Stores URL, ping interval, expected status code
   - `isActive` flag controls monitoring state
   - `sortOrder` for custom ordering in UI

2. **Ping** - Individual monitoring results
   - Stores timestamp, status code, response time, success/failure
   - Related to Endpoint via `endpointId` (cascade delete)
   - Indexed on `endpointId` and `timestamp` for performance

3. **StatusPageConfig** - UI customization
   - Singleton table for branding (logo, colors, text)
   - Used to customize the public status page

### Monitoring System

**Core mechanism (lib/monitor.ts):**
- `MonitorService` is a singleton that manages in-memory cron jobs
- Each active endpoint gets its own cron schedule based on `intervalSeconds`
- Intervals <60s use seconds-based cron (`*/N * * * * *`)
- Intervals ≥60s use minute-based cron (`*/N * * * *`)
- Jobs are stored in a Map keyed by endpoint ID

**Important:** The monitoring service runs in the Next.js server process. This means:
- Monitoring stops when the dev server restarts
- In production, requires persistent server (not serverless)
- Must call `/api/monitor/init` POST endpoint on startup to sync jobs
- The admin page automatically calls this on component mount

### API Routes

**Endpoint management:**
- `GET/POST /api/endpoints` - List all endpoints / Create new
- `GET/PUT/DELETE /api/endpoints/[id]` - Get/Update/Delete specific endpoint

**Status data:**
- `GET /api/status` - Public endpoint for status page data
  - Returns all endpoints with uptime calculations
  - Aggregates ping data for last 90 days

**Configuration:**
- `GET/PUT /api/config` - Status page customization settings

**Monitoring:**
- `POST /api/monitor/init` - Syncs all active endpoints to start monitoring

### Frontend Structure

**Public routes:**
- `/` - Landing page with links to status page and admin
- `/status` - Public status page showing uptime graphs

**Admin routes (password protected):**
- `/admin` - Dashboard to manage endpoints (CRUD operations)
- `/admin/settings` - Customize status page branding

**Authentication:**
- Simple password check using `NEXT_PUBLIC_ADMIN_PASSWORD`
- Implemented client-side in `app/admin/layout.tsx`
- NOT secure for production use - replace with proper auth

### Key Implementation Details

**Uptime calculation:**
- Status page shows 90-day uptime history
- Each day is color-coded based on success rate:
  - Green: ≥99% uptime
  - Yellow: 98-99% uptime
  - Red: <98% uptime
  - Gray: No data

**Prisma client singleton:**
- `lib/prisma.ts` implements the recommended pattern for Next.js
- Uses global variable in development to prevent hot-reload issues
- Single PrismaClient instance shared across API routes

**Real-time monitoring:**
- When endpoint is created/updated via API, monitoring auto-syncs
- DELETE operations cascade to related pings (Prisma relationship)
- Monitoring service logs all pings to console with timestamps

## Common Workflows

**Adding a new endpoint field:**
1. Update `prisma/schema.prisma` Endpoint model
2. Run `npx prisma migrate dev --name add_field_name`
3. Update TypeScript interfaces in relevant components
4. Update API routes to handle new field
5. Update admin form UI

**Modifying uptime calculation:**
- Logic lives in `GET /api/status` route
- Reads ping history and aggregates by day
- Returns structured data consumed by status page components

**Changing monitoring behavior:**
- Core logic in `lib/monitor.ts` MonitorService class
- `pingEndpoint()` method handles actual HTTP requests
- Uses axios with 30s timeout, saves all results to database

## Tech Stack Notes

- **Next.js 15**: Uses App Router (not Pages Router)
- **React 19**: Latest version with new hooks
- **Framer Motion**: For animations on status page
- **Tailwind CSS**: Utility-first styling with custom colors
- **Lucide React**: Icon library
- **node-cron**: Server-side job scheduling (not compatible with serverless)

## Production Deployment Considerations

- This app requires a persistent server process (node-cron dependency)
- NOT compatible with Vercel/serverless unless monitoring is moved to external service
- PostgreSQL database required (no SQLite support)
- Call `/api/monitor/init` on server startup to initialize monitoring
- Consider moving monitoring to separate worker process for scaling
