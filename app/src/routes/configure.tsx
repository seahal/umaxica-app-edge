import type { Route } from "./+types/home";

export const handle = { titleName: "Configuration" };

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
			<h2>Configuration</h2>
			<ul>
				<li className="list-disc list-inside">
					acccount
					<ul className="list-disc list-inside pl-4">
						<li>change email</li>
						<li>delete account</li>
						<li>region</li>
					</ul>
				</li>
				<li className="list-disc list-inside">
					preferences
					<ul className="list-disc list-inside pl-4">
						<li>language</li>
						<li>timezone</li>
						<li>darkmode</li>
						<li>accesivility</li>
					</ul>
				</li>
			</ul>
		</main>
	);
}
