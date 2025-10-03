import type { Route } from "./+types/about";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Sample - Umaxica Com" },
		{ name: "description", content: "Sample page for the corporate site" },
	];
}

export default function Sample() {
	return (
		<main className="p-4 container mx-auto">
			<h2 className="text-lg font-semibold">Sample</h2>
			<p className="mt-2">This is a sample page for the com site.</p>
		</main>
	);
}
