# This unit is TanStack Start on Vite

`app/news` builds with Vite and `@cloudflare/vite-plugin` and runs on workerd, like
every one of the twenty deployment units in this repository. Every frame runs the
same stack, so a pattern copied from a sibling frame is current.

What a sibling can differ in is **archetype**. This unit is a satellite: its
shell is wired into `src/routes/__root.tsx`, so the 404, the 500 and `/offline`
render inside it and carry the header, the footer and the skip link. The three
Cores put their shell on a pathless `_page.tsx` layout route instead, so their
failure documents render bare. Check which one you are reading before copying a
route or a shell change; `docs/design/ui-shell-contract.md` §15 is normative.

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

`adr/013-frames-tanstack-start.md` is the decision record, including what got
worse and the four constraints this stack is used under.
