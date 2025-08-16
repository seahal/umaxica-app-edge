import { Hono } from "hono";
import { renderer } from "./routes/_renderer";
// Import routes
import indexRoute from "./routes/index";
import aboutRoute from "./routes/about/[name]";
import blogIndexRoute from "./routes/blog/index";
import blogContentRoute from "./routes/blog/(content)/[name]";
import merchRoute from "./routes/merch/[...slug]";
import notFoundHandler from "./routes/_404";
import errorHandler from "./routes/_error";
const app = new Hono();
// Apply global renderer
app.use("*", renderer);
// Register routes
app.route("/", indexRoute);
app.route("/about", aboutRoute);
app.route("/blog", blogIndexRoute);
app.route("/blog", blogContentRoute);
app.route("/merch", merchRoute);
// Error handlers
app.notFound(notFoundHandler);
app.onError(errorHandler);
export default app;
