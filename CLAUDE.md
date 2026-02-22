# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Umaxica App (EDGE) — a multi-domain monorepo deploying React Router v7 SSR apps and Hono API services to Cloudflare Workers. Three domain families: umaxica.com (corporate), umaxica.app (service), umaxica.org (staff), plus a dev status dashboard on Vercel.

## Commands

All commands run from the repo root using **pnpm** (not Bun — the README references Bun but the project has migrated to pnpm).

| Task                       | Command                                     |
| -------------------------- | ------------------------------------------- |
| Install deps               | `pnpm install`                              |
| Format                     | `pnpm run format` (oxfmt)                   |
| Lint                       | `pnpm run lint` (oxlint)                    |
| Type check                 | `pnpm run type` (tsgo)                      |
| Run all tests              | `pnpm test` (vitest)                        |
| Run single test file       | `pnpm exec vitest run path/to/file.test.ts` |
| Run tests matching name    | `pnpm exec vitest run -t "test name"`       |
| CF type generation         | `pnpm run cf-typegen`                       |
| Dev server (per workspace) | `pnpm run --filter <workspace> server`      |
| Deploy (per workspace)     | `pnpm run --filter <workspace> deploy`      |

## Architecture

### Workspace Layout

Each domain has a **backend** (Hono on Workers) and **frontend** (React Router v7 SSR on Workers):

| Backend | Frontend      | Domain               | Dev Port |
| ------- | ------------- | -------------------- | -------- |
| `app/`  | `app_www/`    | umaxica.app          | 5171     |
| `com/`  | `com_www/`    | umaxica.com          | 5170     |
| `org/`  | `org_www/`    | umaxica.org          | 5172     |
| —       | `dev_status/` | umaxica.dev (Vercel) | 5173     |
| —       | `net/`        | Network renderer     | —        |

### Frontend Pattern (app_www, com_www, org_www)

- Entry: `workers/app.ts` — creates a request handler from React Router, generates a CSP nonce per request, passes Cloudflare env/ctx via `RouterContextProvider`
- React Router v7 with file-based routing and SSR
- i18next for internationalization (remix-i18next for SSR)
- Sentry integration for error tracking
- Three tsconfig files per workspace: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.cloudflare.json`

### Backend Pattern (app, com, org)

- Hono v4 web framework on Cloudflare Workers
- Ports 8780-8782 for local dev

### Key Dependencies

- **React 19** + React Router v7 + React Aria Components
- **Hono v4** for API services
- **Vite** (via rolldown-vite) for builds
- **Zod v4** for validation
- **Wrangler v4** for Cloudflare deployment

## Testing

- **Vitest** with happy-dom environment, globals enabled
- Tests located in `<workspace>/test/` directories
- Setup file: `vitest.setup.ts` (imports @testing-library/jest-dom)
- Sentry is mocked via `app_www/__mocks__/@sentry/react-router.ts`
- Testing libraries: @testing-library/react, @testing-library/user-event

## Tooling

- **Linter**: oxlint (not ESLint) — config in `.oxlintrc.json`
- **Formatter**: oxfmt (not Prettier/Biome)
- **Type checker**: tsgo (not tsc)
- **Pre-commit hooks**: Lefthook runs format, lint, typecheck, audit, secret-scan (gitleaks), and tests in parallel

## TypeScript

Strict mode enabled. Key compiler options: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. Module resolution is `Bundler`. Path aliases `@app/*`, `@com/*`, `@org/*` map to respective `<workspace>/src/*`.
