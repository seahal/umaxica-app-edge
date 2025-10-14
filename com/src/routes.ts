import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/_index.tsx"),
	route("configure", "routes/configure.tsx"),
	route("*", "routes/catch-all.tsx"),
] satisfies RouteConfig;
