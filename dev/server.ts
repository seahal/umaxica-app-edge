import { createRequestHandler, RouterContextProvider } from "react-router";
import { SECURITY_NONCE_HEADER } from "./src/constants";
import { CloudflareContext } from "./src/context";

function generateNonce(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array));
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

function createLoadContext(nonce: string) {
	const contextProvider = new RouterContextProvider();
	contextProvider.set(CloudflareContext, {
		security: { nonce },
	});
	return contextProvider;
}

// Custom server entrypoint for Vercel
export default async function handler(request: Request): Promise<Response> {
	const nonce = generateNonce();
	const forwardedHeaders = new Headers(request.headers);
	forwardedHeaders.set(SECURITY_NONCE_HEADER, nonce);

	const forwardedRequest = new Request(request, {
		headers: forwardedHeaders,
	});

	const loadContext = createLoadContext(nonce);
	return requestHandler(forwardedRequest, loadContext);
}
