# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers edge application built with HonoX framework that serves multiple domain variants (app, com, org) of the Umaxica service. The application uses domain-based routing to serve different content based on the host.

## Development Commands

This project uses Bun as the package manager and runtime, with Vite for development and building.

```bash
# Install dependencies
bun install

# Development server (runs on port 4000)
bun run dev

# Build for production
bun run build

# Preview production build locally
bun run preview

# Deploy to Cloudflare Workers
bun run deploy

# Testing
bun run test  # Uses Bun test runner

# Code quality
bun run format         # Format with Biome
bun run lint           # Lint with Biome (auto-fix)
bun run typecheck      # TypeScript type checking

# Generate Cloudflare types
bun run cf-typegen
```

## Architecture

### Domain-Based Routing
The application routes based on domain patterns:
- `jp.umaxica.app` / `app.localdomain:4000` → app routes
- `jp.umaxica.com` / `com.localdomain:4000` → com routes  
- `jp.umaxica.org` / `org.localdomain:4000` → org routes
- `umaxica.{com,org,app}` → world routes (redirects to jp.* variants)

Routes are defined using HonoX's file-based routing system in the `app/routes/` directory.

### Project Structure
- `app/` - HonoX application directory
  - `app/server.ts` - Server entry point using HonoX's createApp
  - `app/client.tsx` - Client-side entry point with HonoX's createClient
  - `app/global.tsx` - Global JSX renderer configuration for HTML templates
  - `app/_middleware.ts` - Global middleware configuration
  - `app/routes/` - File-based routes for each domain
    - `app/routes/jp.umaxica.app/` - App domain routes
    - `app/routes/jp.umaxica.com/` - Com domain routes  
    - `app/routes/jp.umaxica.org/` - Org domain routes
    - `app/routes/app.localdomain/` - Local development app domain
    - `app/routes/com.localdomain/` - Local development com domain
    - `app/routes/org.localdomain/` - Local development org domain
- `public/` - Static assets
- `dist-server/` - Built server-side files for Cloudflare Workers deployment

### Technology Stack
- **Runtime**: Cloudflare Workers (production) / Bun + Vite (development)
- **Framework**: HonoX (Hono.js meta-framework with file-based routing)
- **Build**: Vite with HonoX plugin
- **Testing**: Bun test runner
- **Code Quality**: Biome (formatting + linting)
- **TypeScript**: Strict mode enabled

### Middleware Stack (in order)
1. Request logging
2. CSRF protection
3. CORS headers
4. Security headers
5. JSON pretty printing
6. Trailing slash trimming
7. Request timeout (2000ms)
8. Domain-based routing middleware

## Development Notes

- The server runs on port 4000 in development via Bun
- Uses domain-based routing with middleware for local development domains (*.localdomain:4000)
- JSX is configured to use Hono's JSX runtime (`jsxImportSource: "hono/jsx"`)
- File-based routing automatically creates routes based on directory structure
- World routes handle redirects from root domains to Japanese subdomains
- Development server uses Vite's dev server for fast hot reload
- Production builds target Cloudflare Workers runtime

## Environment Variables

### Local Development
Environment variables for local development are defined in `.dev.vars` file:
```
EDGE_CORPORATE_URL='com.localhost'
EDGE_SERVICE_URL='app.localhost'
EDGE_STAFF_URL='org.localhost'
API_CORPORATE_URL='api.com.localhost:3300'
API_SERVICE_URL='api.app.localhost:3300'
API_STAFF_URL='api.org.localhost:3300'
WWW_CORPORATE_URL='www.com.localhost:3300'
WWW_SERVICE_URL='www.app.localhost:3300'
WWW_STAFF_URL='www.org.localhost:3300'
```

### Accessing Environment Variables
In Cloudflare Workers, environment variables must be accessed via the context object, not `process.env`:

```typescript
// Correct way to access environment variables
app.get('/example', (c) => {
  const corporateUrl = c.env.EDGE_CORPORATE_URL
  return c.text(`Corporate URL: ${corporateUrl}`)
})
```

### Production Deployment
Before deploying to Cloudflare Workers, set environment variables in the dashboard or via `wrangler secret put` command. The `.dev.vars` file is only used for local development.