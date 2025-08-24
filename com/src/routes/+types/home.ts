// Generated type file
export interface Route {
	MetaArgs: {
		data?: any;
		params: Record<string, string>;
		matches: any[];
	};
	LoaderArgs: {
		context: {
			cloudflare: {
				env: any;
				ctx: any;
			};
		};
		params: Record<string, string>;
		request: Request;
	};
	ComponentProps: {
		loaderData: {
			message: string;
		};
	};
}
