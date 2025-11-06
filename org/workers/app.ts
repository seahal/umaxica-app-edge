import { createRequestHandler } from "react-router";
import type { AppLoadContext } from "react-router";
import { CloudflareContext } from "../src/context";

function generateNonce(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array));
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	async fetch(request, env, ctx) {
		const nonce = generateNonce();

		const loadContext = new Map() as AppLoadContext;
		loadContext.set(CloudflareContext, {
			cloudflare: { env, ctx },
			security: { nonce },
		});

		return requestHandler(request, loadContext);
	},
} satisfies ExportedHandler<Env>;
