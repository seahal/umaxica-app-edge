import {
	index,
	type RouteConfig,
	route,
	prefix,
	layout,
} from "@react-router/dev/routes";

export default [
	layout("../src/layouts/decorated.tsx", [
		index("routes/_index.tsx"),
		...prefix("configuration", [
			index("routes/configurations/_index.tsx"),
			route("account", "routes/configurations/account.tsx"),
			route("preference", "routes/configurations/preference.tsx"),
		]),
		...prefix("message", [index("routes/messages/_index.tsx")]),
		...prefix("notification", [index("routes/notifications/_index.tsx")]),
		...prefix("explore", [index("routes/explore/_index.tsx")]),
		...prefix("authentication", [index("routes/authentication/_index.tsx")]),
	]),
	layout("../src/layouts/baremetal.tsx", [
		route("/health", "routes/healths/_index.tsx"),
	]),
] satisfies RouteConfig;
