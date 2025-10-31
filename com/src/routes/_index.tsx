import type { Route } from "./+types/_index";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Umaxica Commerce - 商品カタログ" },
		{ name: "description", content: "最適なプランを見つけましょう" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	const env =
		(context as unknown as { cloudflare?: { env?: Record<string, string> } })
			?.cloudflare?.env ?? {};
	return { message: env.VALUE_FROM_CLOUDFLARE };
}

export default function Home(_: Route.ComponentProps) {
	return <div>Home</div>;
}
