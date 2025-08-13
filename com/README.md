# Umaxica Com Domain

This is the commercial domain application for Umaxica, built with Hono and deployed on Cloudflare Workers.

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Run development server:
   ```bash
   bun run dev
   ```
   > **Development URL:** http://localhost:4001

3. Deploy to Cloudflare Workers:
   ```bash
   bun run deploy
   ```

## Structure

- `src/index.tsx` - Main application entry point
- `wrangler.jsonc` - Cloudflare Workers configuration
- `package.json` - Dependencies and scripts

## Environment

- **Development**: http://localhost:4001 (port 4001)
- **Production**: Deployed to Cloudflare Workers
- **Domain**: jp.umaxica.com (production)

## Features

- Server-side rendered pages with Hono HTML templates
- Clean, semantic HTML
- Responsive design
- About page with company information
- Green theme color scheme