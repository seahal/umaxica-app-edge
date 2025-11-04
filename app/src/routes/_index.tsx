import { Timeline } from "../components/Timeline";
import type { Route } from "./+types/_index";
import { CloudflareContext } from "../context";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Umaxica - ホーム" },
		{ name: "description", content: "Umaxica - 今何してる？" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	const cloudflareContext = context.get(CloudflareContext);
	const env = cloudflareContext?.cloudflare.env ?? ({} as Env);
	const message =
		(env as Env & { VALUE_FROM_CLOUDFLARE?: string }).VALUE_FROM_CLOUDFLARE ??
		"";

	return { message };
}

export default function Home(_: Route.ComponentProps) {
	return (
		<div className="bg-white dark:bg-gray-950">
			<Timeline />
		</div>
	);
}
