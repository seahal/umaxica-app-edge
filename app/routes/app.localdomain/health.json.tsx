import type { Context } from "hono";

export default function HealthJson(c: Context) {
	return c.json({ status: "OK" });
}
