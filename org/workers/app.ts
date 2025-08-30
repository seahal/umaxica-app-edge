import { createRequestHandler } from "react-router";

const requestHandler = createRequestHandler(
	// @ts-expect-error - Virtual module import type issue
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	async fetch(request, env, ctx) {
		return requestHandler(request, {
			cloudflare: { env, ctx },
		});
	},
} satisfies ExportedHandler<Env>;
