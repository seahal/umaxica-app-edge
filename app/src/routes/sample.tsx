import type { Route } from "./+types/about";

export const handle = {
	titleName: "Sample",
	breadcrumb: () => "Sample",
};

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Sample" },
		{ name: "description", content: "About this application" },
	];
}

export default function About() {
	return (
		<main className="p-4 container mx-auto">
			<h2 className="text-lg font-semibold">Sample</h2>
			<p className="mt-2">This is the about page for the app site.</p>
		</main>
	);
}
