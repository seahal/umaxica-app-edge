import {
	index,
	type RouteConfig,
	route,
	prefix,
} from "@react-router/dev/routes";

export default [
	index("routes/_index.tsx"),
	...prefix("configuration", [
		index("routes/configurations/_index.tsx"),
		route("account", "routes/configurations/account.tsx"),
		route("preference", "routes/configurations/preference.tsx"),
	]),
	...prefix("message", [index("routes/messages/_index.tsx")]),
	...prefix("notification", [index("routes/notifications/_index.tsx")]),
	...prefix("search", [index("routes/search/_index.tsx")]),
	...prefix("authentication", [index("routes/authentication/_index.tsx")]),
	...prefix("health", [index("routes/healths/_index.tsx")]),
] satisfies RouteConfig;
