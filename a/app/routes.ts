import {
	type RouteConfig,
	index,
	layout,
	route,
} from "@react-router/dev/routes";

export default [
	layout("routes/_layout.tsx", [
		index("routes/_index.tsx"),
		route("about/:name", "routes/about/[name].tsx"),
		route("blog", "routes/blog/index.tsx"),
		route("blog/:name", "routes/blog/(content)/[name].tsx"),
		route("merch/*", "routes/merch/[...slug].tsx"),
	]),
] satisfies RouteConfig;
