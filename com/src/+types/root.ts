// Generated type file
export namespace Route {
	export interface MetaArgs {
		data?: any;
		params: Record<string, string>;
		matches: any[];
	}

	export interface LoaderArgs {
		context: {
			cloudflare: {
				env: any;
				ctx: any;
			};
		};
		params: Record<string, string>;
		request: Request;
	}

	export interface ComponentProps {
		children?: React.ReactNode;
	}
}
