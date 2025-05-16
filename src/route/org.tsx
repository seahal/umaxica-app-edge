import { Hono } from "hono/quick";

const app = new Hono();
app.get("/", (c) => c.html("home page of umaxica"));
app.get("/about", (c) => c.html("About page of umaxica"));

export default app;
