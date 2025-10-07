import { Activity } from "react";
import type { Route } from "./+types/about";
import { Button } from "react-aria-components";

export const handle = {
	titleName: "About",
	breadcrumb: () => "About",
};

export function meta(_: Route.MetaArgs) {
	return [{ name: "description", content: "About this application" }];
}

export default function About() {
	return (
		<main className="p-4 container mx-auto">
			<h2 className="text-lg font-semibold">About</h2>
			<p className="mt-2">This is the about page for the app site.</p>
			<Button onPress={() => alert("Hello world!")}>Press me</Button>
		</main>
	);
}
