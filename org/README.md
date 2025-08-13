# Umaxica Org Domain

This is the organizational domain application for Umaxica, built with Hono and deployed on Cloudflare Workers.

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Run development server:
   ```bash
   bun run dev
   ```
   > **Development URL:** http://localhost:4003

3. Deploy to Cloudflare Workers:
   ```bash
   bun run deploy
   ```

## Structure

- `src/index.tsx` - Main application entry point
- `wrangler.jsonc` - Cloudflare Workers configuration
- `package.json` - Dependencies and scripts

## Environment

- **Development**: http://localhost:4003 (port 4003)
- **Production**: Deployed to Cloudflare Workers
- **Domain**: jp.umaxica.org (production)

## Features

- Server-side rendered pages with Hono HTML templates
- Admin panel interface (/admin)
- Organizational management tools
- Clean, semantic HTML
- Responsive design
- Purple theme color scheme