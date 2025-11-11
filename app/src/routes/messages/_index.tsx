import { readCloudflareContext } from "../../context";
import type { Route } from "../+types/home";

export function meta(_: Route.MetaArgs) {
	return [{ name: "description", content: "Welcome to React Router!" }];
}

export function loader({ context }: Route.LoaderArgs) {
	const cloudflareContext = readCloudflareContext(context);
	const env = cloudflareContext?.cloudflare?.env ?? ({} as Env);
	return {
		message:
			(env as Env & { VALUE_FROM_CLOUDFLARE: string }).VALUE_FROM_CLOUDFLARE ??
			"",
	};
}

export default function App(_: Route.ComponentProps) {
	return (
		<main className="p-4 container mx-auto">
			<h2>Message</h2>
			<p>underconstrution...</p>
		</main>
	);
}
