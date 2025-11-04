import { createContext } from "react-router";

// Cloudflare Worker環境のcontext
export const CloudflareContext = createContext<{
	cloudflare: {
		env: Env;
		ctx: ExecutionContext;
	};
	security: {
		nonce: string;
	};
}>();
