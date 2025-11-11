// Cloudflare Worker環境のcontext
// React Router v7では Symbol をcontext keyとして使用
export const CloudflareContext = Symbol("CloudflareContext") as symbol & {
	__type?: {
		cloudflare?: {
			env?: Env;
			ctx?: ExecutionContext;
		};
		security?: {
			nonce?: string;
		};
	};
};

export type SymbolReader = {
	get?: <Result>(key: symbol & { __type?: Result }) => Result | undefined;
};

export type CloudflareContextValue = NonNullable<
	(typeof CloudflareContext)["__type"]
>;

export function readCloudflareContext(
	source?: unknown,
): CloudflareContextValue | undefined {
	const reader = source as SymbolReader | null | undefined;
	return reader?.get?.(CloudflareContext);
}
