import { Hono } from "hono";
import { renderer } from "./routes/_renderer";

// Import routes
import notFoundHandler from "./routes/_404";
import errorHandler from "./routes/_error";
import indexRoute from "./routes/index";
import healthIndexRoute from "./routes/health/index";

const app = new Hono();

// Apply global renderer
app.use("*", renderer);

// Register routes
app.route("/", indexRoute);
app.route("/health", healthIndexRoute);

// Error handlers
app.notFound(notFoundHandler);
app.onError(errorHandler);

export default app;
