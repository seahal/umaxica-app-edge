import { index, type RouteConfig, route, prefix } from "@react-router/dev/routes";

export default [
	index("routes/_index.tsx"),
	route("about", "routes/about.tsx"),
	...prefix("configure", [
		index("routes/configure/_index.tsx"),
		route("account", "routes/configure/account.tsx"),
		route("preference", "routes/configure/preference.tsx"),
	]),
] satisfies RouteConfig;
