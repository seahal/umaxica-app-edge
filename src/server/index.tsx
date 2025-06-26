import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";

const app = new Hono();

app.use("*", csrf());
app.use("*", cors());
app.use("*", secureHeaders());

// Domain-based routing
app.get("/", (c) => {
	const host = c.req.header("host") || "";

	if (host.includes("app.localdomain")) {
		return c.html(
			`
      <div>
        <header>
          <h1>Umaxica(app, edge)</h1>
        </header>
        <hr />
        <p>Welcome to umaxica</p>
        <hr />
        <footer>
          <p>© umaxica</p>
        </footer>
      </div>
    `,
			200,
			{
				"Content-Type": "text/html; charset=UTF-8",
			},
		);
	}

	if (host.includes("com.localdomain")) {
		return c.html(
			`
      <div>
        <header>
          <h1>Umaxica(com, edge)</h1>
        </header>
        <hr />
        <p>Welcome to umaxica</p>
        <hr />
        <footer>
          <p>© umaxica</p>
        </footer>
      </div>
    `,
			200,
			{
				"Content-Type": "text/html; charset=UTF-8",
			},
		);
	}

	if (host.includes("org.localdomain")) {
		return c.html(
			`
      <div>
        <header>
          <h1>Umaxica(org, edge)</h1>
        </header>
        <hr />
        <p>Welcome to umaxica</p>
        <hr />
        <footer>
          <p>© umaxica</p>
        </footer>
      </div>
    `,
			200,
			{
				"Content-Type": "text/html; charset=UTF-8",
			},
		);
	}

	return c.text("Hello World");
});

export default app;
