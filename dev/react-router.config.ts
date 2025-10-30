import { vercelPreset } from "@vercel/react-router/vite";
import type { Config } from "@react-router/dev/config";

export default {
	// Config options...
	// Server-side render by default, to enable SPA mode set this to `false`
	ssr: true,
	appDirectory: "src",
	future: {
		unstable_viteEnvironmentApi: true,
	} as Config["future"],
	presets: [vercelPreset()],
} satisfies Config;
