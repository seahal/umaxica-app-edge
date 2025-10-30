import type { Config } from "@react-router/dev/config";

export default {
	appDirectory: "src",
	ssr: true,
	future: {
		unstable_viteEnvironmentApi: true,
		unstable_middleware: true,
	} as Config["future"],
} satisfies Config;
