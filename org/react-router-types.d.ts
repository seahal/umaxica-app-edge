// Minimal React Router type shims for the org site
declare module "react-router" {
	export interface EntryContext {
		[key: string]: unknown;
	}

	export interface ServerRouterProps {
		context: EntryContext;
		url: string;
	}
	export function ServerRouter(props: ServerRouterProps): JSX.Element;

	export function useLoaderData<T = unknown>(): T;
	export function useRouteLoaderData<T = unknown>(routeId: string): T | undefined;
	export function isRouteErrorResponse(
		error: unknown,
	): error is { status: number; statusText?: string };

	export function Links(): JSX.Element;
	export function Meta(): JSX.Element;
	export function Outlet(): JSX.Element;
	export interface ScriptsProps {
		nonce?: string;
	}
	export function Scripts(props?: ScriptsProps): JSX.Element;
	export function ScrollRestoration(): JSX.Element;

	export function Link(props: Record<string, unknown>): JSX.Element;
	export function NavLink(props: Record<string, unknown>): JSX.Element;
	export function redirect(url: string): Response;
	export function useLocation(): Location;

	export function createRequestHandler(
		...args: unknown[]
	): (request: Request, context: unknown) => Promise<Response>;

	export namespace Route {
		export interface LoaderArgs {
			context: AppLoadContext;
			request: Request;
			params: Record<string, string>;
		}
		export interface ActionArgs {
			request: Request;
			context: AppLoadContext;
			params: Record<string, string>;
		}
		export interface MetaArgs {
			data?: unknown;
			params: Record<string, string>;
			location: Location;
			matches: unknown[];
		}
		export interface ComponentProps {
			loaderData?: any;
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
