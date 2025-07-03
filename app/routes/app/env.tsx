import { Hono } from "hono";
import type { FC } from "hono/jsx";

type Bindings = {
	EDGE_CORPORATE_URL: string;
	EDGE_SERVICE_URL: string;
	EDGE_STAFF_URL: string;
	API_CORPORATE_URL: string;
	API_SERVICE_URL: string;
	API_STAFF_URL: string;
	WWW_CORPORATE_URL: string;
	WWW_SERVICE_URL: string;
	WWW_STAFF_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/env", (c) => {
	const envVars = {
		EDGE_CORPORATE_URL: c.env.EDGE_CORPORATE_URL,
		EDGE_SERVICE_URL: c.env.EDGE_SERVICE_URL,
		EDGE_STAFF_URL: c.env.EDGE_STAFF_URL,
		API_CORPORATE_URL: c.env.API_CORPORATE_URL,
		API_SERVICE_URL: c.env.API_SERVICE_URL,
		API_STAFF_URL: c.env.API_STAFF_URL,
		WWW_CORPORATE_URL: c.env.WWW_CORPORATE_URL,
		WWW_SERVICE_URL: c.env.WWW_SERVICE_URL,
		WWW_STAFF_URL: c.env.WWW_STAFF_URL,
	};

	return c.json(envVars);
});

export default app;
