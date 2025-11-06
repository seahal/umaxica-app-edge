// React Router v7 type extensions for AppLoadContext
import "react-router";
import type { AppLoadContext } from "react-router";

declare module "react-router" {
	interface AppLoadContext {
		get<T>(key: symbol): T | undefined;
		set<T>(key: symbol, value: T): void;
	}

	// Create a context key with type inference
	export function createContext<T>(): symbol & { __type?: T };

	// Middleware type for v8_middleware feature
	export namespace Route {
		interface MiddlewareArgs {
			context: AppLoadContext;
			request: Request;
			params: Record<string, string | undefined>;
		}

		type Middleware = (args: MiddlewareArgs) => void | Promise<void>;
	}
}
