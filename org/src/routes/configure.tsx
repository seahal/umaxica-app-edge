import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "configure" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	const env =
		(context as unknown as { cloudflare?: { env?: Record<string, string> } })
			?.cloudflare?.env ?? {};
	return { message: env.VALUE_FROM_CLOUDFLARE };
}

export default function About({
	loaderData: _loaderData,
}: Route.ComponentProps) {
	return (
		<main className="p-4 container mx-auto">
			<Link to="/">
				<h2 className="text-lg font-semibold">Umaxica</h2>
			</Link>
			<Link to="/">home</Link> &lt; <Link to="/configure">configure</Link>
		</main>
	);
}
