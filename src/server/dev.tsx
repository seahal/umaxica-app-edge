import { serve } from "bun";
import main from "./index";

const server = serve({
	port: 4000,
	hostname: "127.0.0.1",
	fetch: main.fetch,
});

console.log(`🚀 Server running at http://localhost:${server.port}`);
