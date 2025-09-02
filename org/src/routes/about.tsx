import type { Route } from "./+types/about";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "About - Umaxica Org" },
		{ name: "description", content: "About this organization site" },
	];
}

export default function About() {
	return (
		<main className="p-4 container mx-auto">
			<h2 className="text-lg font-semibold">About</h2>
			<p className="mt-2">This is the about page for the org site.</p>
		</main>
	);
}
