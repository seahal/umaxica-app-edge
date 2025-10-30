import { createRequestHandler } from "react-router";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
		security?: {
			nonce?: string;
		};
	}
}

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
		return requestHandler(request, {
			cloudflare: { env, ctx },
			security: { nonce },
		});
	},
} satisfies ExportedHandler<Env>;
