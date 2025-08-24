import { createHonoServer } from "react-router-hono-server/node";
import server from "./server";

export default await createHonoServer({
	routes: async () => {
		const { default: routes } = await import("./routes");
		return routes;
	},
});
