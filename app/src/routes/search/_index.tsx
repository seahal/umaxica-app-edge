import type { Route } from "../+types/home";
import { Link } from "react-router-dom";

export const handle = {
	titleName: "Search",
	breadcrumb: () => "Search",
};

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
			<h2>Search</h2>
			<form>
				<input
					type="text"
					name="q"
					placeholder="Search..."
					className="border border-gray-300 rounded-md p-2 w-full"
				/>
				<button
					type="submit"
					className="mt-2 bg-blue-500 text-white rounded-md p-2"
				>
					Search
				</button>
				<div className="mt-4">
					<Link to="/">Go to Home</Link>
				</div>
			</form>
		</main>
	);
}
