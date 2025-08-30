import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "configure" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	return {
		message: (context.cloudflare.env as Env & { VALUE_FROM_CLOUDFLARE: string })
			.VALUE_FROM_CLOUDFLARE,
	};
}

export default function About(_: Route.ComponentProps) {
	return (
		<>
			<Link to="/">
				<h1>umaxica</h1>
			</Link>
			<Link to="/">home</Link> &lt; <Link to="/configure">configure</Link>
		</>
	);
}
