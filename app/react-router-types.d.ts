// React Router type declarations for app
declare module "react-router" {
	export interface EntryContext {
		[key: string]: unknown;
	}
	export interface ServerRouterProps {
		context: EntryContext;
		url: string;
	}
	export function ServerRouter(props: ServerRouterProps): JSX.Element;
	export function isRouteErrorResponse(error: unknown): boolean;
	export function Links(): JSX.Element;
	export function Meta(): JSX.Element;
	export function Outlet(): JSX.Element;
	export function Scripts(): JSX.Element;
	export function ScrollRestoration(): JSX.Element;
	export function Link(props: Record<string, unknown>): JSX.Element;
	export function createRequestHandler(
		...args: unknown[]
	): (request: Request, context: unknown) => Promise<Response>;

	export namespace Route {
		export interface LoaderArgs {
			context: AppLoadContext;
			request: Request;
			params: Record<string, string>;
		}
		export interface MetaArgs {
			data?: unknown;
			params: Record<string, string>;
			location: Location;
			matches: unknown[];
		}
		export interface ComponentProps {
			loaderData?: unknown;
		}
		export interface ErrorBoundaryProps {
			error: unknown;
		}
		export type LinksFunction = () => Array<{
			rel: string;
			href: string;
			[key: string]: string;
		}>;
	}

	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}
