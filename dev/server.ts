import { RouterContextProvider } from "react-router";
import { CloudflareContext } from "./src/context";

function generateNonce(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array));
}

export function getLoadContext() {
	const nonce = generateNonce();

	const contextProvider = new RouterContextProvider();
	contextProvider.set(CloudflareContext, {
		security: { nonce },
	});

	return contextProvider;
}
