import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/_index.tsx"),
	route("configure", "routes/configure.tsx"),
	route("about", "routes/about.tsx"),
	route("sample", "routes/sample.tsx"),
] satisfies RouteConfig;
