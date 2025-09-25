import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
	return [{ name: "description", content: "Welcome!" }];
}

export function loader({ context }: Route.LoaderArgs) {
	return {
		message: (context.cloudflare.env as Env & { VALUE_FROM_CLOUDFLARE: string })
			.VALUE_FROM_CLOUDFLARE,
	};
}

export default function Home({ loaderData }: Route.ComponentProps) {
	return <Welcome message={loaderData.message} />;
}
