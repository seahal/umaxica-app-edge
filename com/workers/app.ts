import { createRequestHandler } from "react-router";
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

		// Create context as a Map-like object with get/set methods
		const contextMap = new Map();
		contextMap.set(CloudflareContext, {
			cloudflare: { env, ctx },
			security: { nonce },
		});

		const context = {
			get: (key: symbol) => contextMap.get(key),
			set: (key: symbol, value: any) => contextMap.set(key, value),
		};

		return requestHandler(request, context);
	},
} satisfies ExportedHandler<Env>;
