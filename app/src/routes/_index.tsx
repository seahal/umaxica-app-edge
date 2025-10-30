import { Timeline } from "../components/Timeline";
import type { Route } from "./+types/_index";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Umaxica - ホーム" },
		{ name: "description", content: "Umaxica SNS - 今何してる？" },
	];
}

type LoaderContext = {
	cloudflare?: {
		env?: Partial<Env> & { VALUE_FROM_CLOUDFLARE?: string };
	};
};

export function loader({ context }: Route.LoaderArgs) {
	const loaderContext = context as LoaderContext;
	const message = loaderContext.cloudflare?.env?.VALUE_FROM_CLOUDFLARE ?? "";

	return { message };
}

export default function Home(_: Route.ComponentProps) {
	return (
		<div className="min-h-screen bg-white dark:bg-gray-950">
			<Timeline />
		</div>
	);
}
