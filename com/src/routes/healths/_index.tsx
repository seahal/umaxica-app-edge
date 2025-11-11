import type { Route } from "../../+types/healths/_index";
import { readCloudflareContext } from "../../context";

export function meta(_: Route.MetaArgs) {
	return [{ name: "description", content: "status page" }];
}

export function loader({ context }: Route.LoaderArgs) {
	const cloudflareContext = readCloudflareContext(context);
	const env = cloudflareContext?.cloudflare?.env ?? ({} as Env);
	return {
		message: env.VALUE_FROM_CLOUDFLARE ?? "",
	};
}

export default function Index(_: Route.ComponentProps) {
	return (
		<main className="p-4 container mx-auto">
			<h2>ok</h2>
		</main>
	);
}
