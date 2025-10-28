import type { Route } from "../+types/home";
import { Link } from "react-router-dom";

export function meta(_: Route.MetaArgs) {
	return [
		{ name: "title", content: "hello!!!" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	const env = context.cloudflare.env as Env;
	return { message: env.SECRET_SAMPLE };
}

export default function About({ loaderData }: Route.ComponentProps) {
	return (
		<main className="p-4 container mx-auto">
			<h2>Configuration</h2>
			<ul>
				<li className="list-disc list-inside">
					<Link to="/configuration/account">acccount</Link>
					<ul className="list-disc list-inside pl-4">
						<li>change email</li>
						<li>delete account</li>
						<li>region</li>
					</ul>
				</li>
				<li className="list-disc list-inside">
					<Link to="/configuration/preference">preference</Link>
					<ul className="list-disc list-inside pl-4">
						<li>language</li>
						<li>timezone</li>
						<li>darkmode</li>
						<li>accesivility</li>
					</ul>
				</li>
			</ul>

			<p>SECRET ⇢ {loaderData.message}</p>
		</main>
	);
}
