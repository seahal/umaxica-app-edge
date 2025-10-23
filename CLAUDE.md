# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers edge application that serves multiple domain variants (app, com, org) of the Umaxica service. The project has migrated from HonoX to React Router v7 and uses a multi-domain monorepo architecture where each domain is an independent React Router application.

## Development Commands

This project uses Bun as the package manager. Each domain directory (com/, org/) has its own React Router application with independent development commands.

### Root Level Commands
```bash
# Install dependencies for all domains
bun install

# Testing (Vitest via Bun scripts)
bun run test

# Code quality (affects all domains)
bun run format         # Format with Biome
bun run lint           # Lint with Biome (auto-fix)
bun run typecheck      # TypeScript type checking

# Generate Cloudflare types
bun run cf-typegen
```

### Per-Domain Commands (com/, org/)
```bash
# Development server (React Router dev server on port 5173)
bun run dev

# Build for production
bun run build

# Preview production build locally
bun run preview

# Deploy to Cloudflare Workers
bun run deploy

# TypeScript type checking for domain
bun run typecheck      # Includes cf-typegen, react-router typegen, and tsc
```

## Architecture

### Multi-Domain Monorepo Structure

The project uses a **domain-separated architecture** where each domain is a completely independent React Router v7 application:

- `/com/` - Commercial domain (`umaxica-edge-com`)
- `/org/` - Organization domain (`weathered-star-5e17`)
- `/app/` - Application domain (referenced in tests, not yet implemented)

### Domain Structure

Each domain directory contains:

```
{domain}/
├── app/
│   ├── root.tsx           # Root layout with error boundaries
│   ├── routes.ts          # Route configuration
│   ├── routes/home.tsx    # _index route component
│   ├── entry.client.tsx   # Client hydration entry
│   ├── entry.server.tsx   # Server-side rendering entry
│   └── welcome/           # Welcome component
├── workers/app.ts         # Cloudflare Worker entry point
├── react-router.config.ts # React Router configuration
├── vite.config.ts         # Vite + plugins configuration
├── wrangler.jsonc         # Cloudflare deployment config
└── package.json          # Domain-specific scripts and dependencies
```

### Technology Stack

- **Runtime**: Cloudflare Workers (production) / Vite dev server (development)
- **Framework**: React Router v7 with server-side rendering
- **React Version**: React 19 with React Compiler integration
- **Build System**: React Router dev tools + Vite
- **Testing**: Vitest (run through Bun scripts)
- **Code Quality**: Biome (formatting + linting)
- **TypeScript**: Strict mode with comprehensive type generation

### Domain Routing Strategy

The application implements domain-based routing:

**Domain Mapping:**
- `*.umaxica.com` / `com.localdomain` → Commercial domain
- `*.umaxica.org` / `org.localdomain` → Organization domain
- `*.umaxica.app` / `app.localdomain` → Application domain
- Root domains (`umaxica.{com,org,app}`) → Redirect to `jp.*` Japanese variants

**Development Domains:**
- `com.localdomain:5173` for com/ domain development
- `org.localdomain:5173` for org/ domain development

### React Compiler Integration

Both domains include **React Compiler** for React 19:

```typescript
// vite.config.ts
const ReactCompilerConfig = {
  target: "19"  // React 19 target
};

plugins: [
  babel({
    filter: /\.[jt]sx?$/,
    babelConfig: {
      presets: ["@babel/preset-typescript"],
      plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
    },
  }),
]
```

### Shared Configuration

- `<domain>/edge-runtime.ts` - Runtime helpers co-located with each domain (app/com/org/dev)
- `/test/` - Cross-domain testing utilities and domain routing tests

## React Router Configuration

Each domain uses React Router v7 with the following configuration:

```typescript
// react-router.config.ts
export default {
  appDirectory: "app",
  ssr: true,
  future: {
    unstable_viteEnvironmentApi: true,
  },
} satisfies Config;
```

## Working with Domains

### Development Workflow

1. Navigate to the specific domain directory (`com/` or `org/`)
2. Each domain has independent package.json and can be developed separately
3. Use `bun run dev` within the domain directory to start the development server
4. Access via `localhost:5173` or configured local domains

### Adding New Domains

To add a new domain (like `app/`):

1. Create domain directory with React Router v7 structure
2. Copy `package.json`, `react-router.config.ts`, `vite.config.ts` from existing domain
3. Include React Compiler configuration in `vite.config.ts`
4. Add Babel preset and React Compiler plugin dependencies
5. Create Cloudflare Worker entry in `workers/app.ts`
6. Configure domain routing in tests

### Environment Variables

Environment variables in Cloudflare Workers are accessed via the context object:

```typescript
// In React Router loaders/actions
export async function loader({ context }) {
  const { env } = context.cloudflare;
  const apiUrl = env.API_URL;
  // Use environment variables
}
```

### Deployment

Each domain deploys independently to Cloudflare Workers:
- Use `bun run deploy` within the domain directory
- Configure environment variables in Cloudflare dashboard or via `wrangler secret put`
- Each domain has its own `wrangler.jsonc` configuration
