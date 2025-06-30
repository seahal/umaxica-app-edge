import honox from "honox/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [honox()],
	server: {
		port: 4000
	}
});