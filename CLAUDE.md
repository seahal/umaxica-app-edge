# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers edge application built with Hono.js framework that serves multiple domain variants (app, com, org) of the Umaxica service. The application uses domain-based routing to serve different content based on the host.

## Development Commands

This project uses Bun as the package manager and runtime.

```bash
# Install dependencies
bun install

# Development server (runs on port 4444)
bun run server

# Build for production (builds both client and SSR)
bun run build

# Preview production build locally
bun run preview

# Deploy to Cloudflare Workers
bun run deploy

# Testing
bun run test  # Uses Bun test runner

# Code quality
bun run format    # Format with Biome
bun run lint      # Lint with Biome (auto-fix)
bun run typecheck # TypeScript type checking

# Generate Cloudflare types
bun run cf-typegen
```

## Architecture

### Domain-Based Routing
The application routes based on domain patterns:
- `jp.umaxica.app` / `app.localdomain:4444` → app routes
- `jp.umaxica.com` / `com.localdomain:4444` → com routes  
- `jp.umaxica.org` / `org.localdomain:4444` → org routes
- `umaxica.{com,org,app}` → world routes (redirects to jp.* variants)

Routes are defined in `src/index.tsx` using Hono's routing system.

### Project Structure
- `src/index.tsx` - Main application entry point with middleware and routing
- `src/renderer.tsx` - JSX renderer configuration for HTML templates
- `src/route/` - Route handlers for each domain (app.tsx, com.tsx, org.tsx, world.tsx)
- `src/component/` - Layout components organized by domain
- `dist-server/` - Built server-side files for Cloudflare Workers deployment

### Technology Stack
- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js with JSX support
- **Build**: Vite with Cloudflare plugin
- **Testing**: Bun test runner
- **Code Quality**: Biome (formatting + linting)
- **TypeScript**: Strict mode enabled

### Middleware Stack (in order)
1. Language detector (en/ja, defaults to ja)
2. CSRF protection
3. CORS headers
4. Request logging
5. JSON pretty printing
6. Trailing slash trimming
7. Security headers
8. JSX renderer
9. Request timeout (2000ms)

## Development Notes

- The server runs on port 4444 in development
- Uses domain-based routing with local development domains (*.localdomain:4444)
- JSX is configured to use Hono's JSX runtime (`jsxImportSource: "hono/jsx"`)
- Each domain has its own layout component in `src/component/{domain}/layout.tsx`
- World routes handle redirects from root domains to Japanese subdomains