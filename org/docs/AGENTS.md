# This unit is TanStack Start on Vite, not Next.js

`org/docs` was the first frame to leave Next.js + `@opennextjs/cloudflare`. It
builds with Vite and `@cloudflare/vite-plugin` and runs on workerd, like the apex
Workers do. The remaining frames still build through Next.js, so do not copy a
pattern from a sibling frame without checking which of the two it is.

This file used to carry a `<!-- BEGIN:nextjs-agent-rules -->` block that
`next dev` wrote and re-added on every run. Nothing regenerates it now, and
leaving it would have pointed readers at `node_modules/next/dist/docs/` in a unit
with no `next` dependency at all.

TanStack Start is at Release Candidate, and its API moves quickly. Read the
current documentation rather than working from memory:

- <https://tanstack.com/start/latest/docs/framework/react/overview>
- <https://tanstack.com/router/latest/docs/framework/react/guide/document-head-management>
- <https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/>

## What is load-bearing here

- **`src/routes/__root.tsx` declares no `title`.** `<HeadContent />` renders the
  head tags of every matched route and React hoists a `<title>` a component
  renders on top of that, so a root title plus a failure document's own title
  serves TWO `<title>` elements — and `api/title-contract.hurl` asserts there is
  exactly one. Every route owns its title; `src/lib/title.ts` composes the suffix.
- **`src/server.ts` uses `defaultRenderHandler`, not `defaultStreamHandler`.**
  Streaming flushes the shell before a failure is known, so a thrown error
  produced a 200 with no `<title>` and no error document. Rendering to a string
  first is what makes the 500 real.
- **`vite.config.ts` forwards `EDGE_LOCAL_*` only while serving.** `vite dev`
  runs the Worker in workerd, whose `process.env` comes from the Worker's own
  vars rather than the shell, so the flags have to be bridged — but forwarding
  them during a build bakes them into the production artefact.
- **`remoteBindings` is false unless `CLOUDFLARE_ENV=vpc`.** A Workers VPC
  Service has no local simulator, so the default (`true`) makes every command
  demand an interactive `wrangler login`.
- **No `assets.directory` in `wrangler.jsonc`.** `vite build` writes it into the
  output config; see `adr/012-apex-vite-build-and-static-assets.md`.

`plans/info-nextjs-to-tanstack-start.md` is the full record, including what got
worse.
