// Cloudflare Worker環境のcontext
// React Router v7では Symbol をcontext keyとして使用
export const CloudflareContext = Symbol("CloudflareContext") as symbol & {
	__type?: {
		cloudflare?: {
			env?: Record<string, string>;
			ctx?: ExecutionContext;
		};
		security?: {
			nonce?: string;
		};
	};
};
