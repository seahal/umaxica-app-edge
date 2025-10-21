import { createRequestHandler } from "react-router";
import { generateNonce, withSecurityHeaders } from "../../edge-runtime";

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	async fetch(request, env, ctx) {
		const nonce = generateNonce();
		const res = await requestHandler(request, {
			cloudflare: { env, ctx },
			security: { nonce },
		});
		return withSecurityHeaders(request, res, { cspNonce: nonce });
	},
} satisfies ExportedHandler<Env>;
