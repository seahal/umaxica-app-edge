declare module "react-router" {
	export interface UIMatch<Data = unknown, Handles = unknown> {
		id: string;
		pathname?: string;
		pathnameBase?: string;
		params: Record<string, string | undefined>;
		data?: Data;
		handle?: Handles;
	}

	export function useMatches<Data = unknown, Handles = unknown>(): Array<
		UIMatch<Data, Handles>
	>;
}
