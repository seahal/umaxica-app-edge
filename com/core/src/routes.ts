import { index, layout, prefix, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  layout("../src/layouts/decorated.tsx", [index("routes/_index.tsx")]),
  ...prefix("explore", [index("routes/explore/_index.tsx")]),
  layout("../src/layouts/baremetal.tsx", [route("/health", "routes/healths/_index.tsx")]),
] satisfies RouteConfig;
