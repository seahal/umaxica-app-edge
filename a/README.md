# Umaxica App Domain

This is the main application domain for Umaxica, built with Hono and deployed on Cloudflare Workers.

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Run development server:
   ```bash
   bun run dev
   ```
   > **Development URL:** http://localhost:4002

3. Deploy to Cloudflare Workers:
   ```bash
   bun run deploy
   ```

## Structure

- `src/index.tsx` - Main application entry point with routing
- `wrangler.jsonc` - Cloudflare Workers configuration
- `package.json` - Dependencies and scripts

## Environment

- **Development**: http://localhost:4002 (port 4002)
- **Production**: Deployed to Cloudflare Workers
- **Domain**: jp.umaxica.app (production)

## Features

- Server-side rendered pages with Hono HTML templates
- Multiple routes (/, /about, /contact)
- Health check endpoints (/health, /health.json)
- Clean, semantic HTML
- Responsive design
- Blue theme color scheme