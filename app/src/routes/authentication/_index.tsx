import type { Route } from "../+types/home";

export function meta(_: Route.MetaArgs) {
	return [{ name: "description", content: "Welcome to React Router!" }];
}

export function loader({ context }: Route.LoaderArgs) {
	return {
		message: (context.cloudflare.env as Env & { VALUE_FROM_CLOUDFLARE: string })
			.VALUE_FROM_CLOUDFLARE,
	};
}

export default function About(_: Route.ComponentProps) {
	return (
		<main className="p-4 container mx-auto">
			<h2>Authentication</h2>
			<a href="https://auth.umaxica.app/registration/new" rel="noopener">
				<p>Sign up</p>
			</a>
			<a href="https://auth.umaxica.app/authentication/new" rel="noopener">
				<p>Sign in</p>
			</a>
		</main>
	);
}
