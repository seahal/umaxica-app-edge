import { Hono } from "hono/quick";
import type { FC } from "hono/jsx";
import Layout from "../component/app/layout";

const app = new Hono();

// Navigation component
const Nav: FC = () => (
	<nav>
		<a href="/">Home</a> | <a href="/about">About</a> | <a href="/contact">Contact</a>
	</nav>
);

app.get("/", (c) =>
	c.html(
		<Layout title="Home">
			<Nav />
			<h2>Welcome to umaxica</h2>
			<p>This is the home page.</p>
		</Layout>
	),
);

app.get("/about", (c) => 
	c.html(
		<Layout title="About">
			<Nav />
			<h2>About</h2>
			<p>About page of umaxica</p>
		</Layout>
	)
);

app.get("/contact", (c) => 
	c.html(
		<Layout title="Contact">
			<Nav />
			<h2>Contact</h2>
			<p>Contact us at contact@umaxica.app</p>
		</Layout>
	)
);

export default app;
