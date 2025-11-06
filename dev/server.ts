import { createRequestHandler, RouterContextProvider } from "react-router";
import { CloudflareContext } from "./src/context";

function generateNonce(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array));
}

// Custom server entrypoint for Vercel
export default async function handler(request: Request): Promise<Response> {
	const nonce = generateNonce();

	// Create RouterContextProvider instance for middleware
	const contextProvider = new RouterContextProvider();
	contextProvider.set(CloudflareContext, {
		security: { nonce },
	});

	// Create request handler with server build
	const requestHandler = createRequestHandler(
		// @ts-expect-error - virtual module
		await import("virtual:react-router/server-build"),
		import.meta.env.MODE,
	);

	// Handle the request with the context provider
	return requestHandler(request, contextProvider);
}
