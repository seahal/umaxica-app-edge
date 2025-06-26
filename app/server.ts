import { showRoutes } from 'hono/dev'
import { createApp } from 'honox/server'

const app = createApp({
  getPath: (req) => req.url.replace(/^https?:\/([^?]+).*$/, "$1"),
})

showRoutes(app)

export default app