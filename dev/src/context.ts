// createContext implementation for React Router v7 context API
function createContext<T>(): symbol & { __type?: T } {
	return Symbol() as symbol & { __type?: T };
}

// Cloudflare Worker環境のcontext
export const CloudflareContext = createContext<{
	cloudflare?: {
		env?: Record<string, string>;
		ctx?: ExecutionContext;
	};
	security: {
		nonce: string;
	};
}>();
