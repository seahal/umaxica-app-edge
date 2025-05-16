import { Hono } from "hono/quick";
import type { FC } from "hono/jsx";
import Layout from "../component/app/layout";

const app = new Hono();

app.get("/", (c) =>
	c.html(<Layout title="umaxica">Welcome to umaxica</Layout>),
);
app.get("/about", (c) => c.html("About page of umaxica"));

export default app;
