import type { Route } from "../+types/home";

export const meta: Route.MetaFunction = () => [
	{ name: "description", content: "status page" },
];

type LoaderArgs = {
	context: {
		cloudflare?: { env?: Record<string, string> };
	};
};

export function loader({ context }: LoaderArgs) {
	const env = context.cloudflare?.env ?? {};
	return {
		message: env.VALUE_FROM_CLOUDFLARE,
	};
}

export default function Index() {
	return (
		<main className="p-4 container mx-auto">
			<h2>ok</h2>
		</main>
	);
}
