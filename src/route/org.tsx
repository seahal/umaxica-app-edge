import { Hono } from "hono/quick";
import Layout from "../component/org/layout";

const app = new Hono();

app.get("/", (c) =>
	c.html(<Layout title="umaxica">Welcome to umaxica</Layout>),
);

app.get("/", (c) => c.html("home page of umaxica"));
app.get("/about", (c) => c.html("About page of umaxica"));

export default app;
