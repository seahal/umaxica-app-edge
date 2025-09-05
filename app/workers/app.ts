import { createRequestHandler } from "react-router";
import { withSecurityHeaders } from "../../shared/security";

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	async fetch(request, env, ctx) {
		const res = await requestHandler(request, {
			cloudflare: { env, ctx },
		});
		return withSecurityHeaders(request, res);
	},
} satisfies ExportedHandler<Env>;
