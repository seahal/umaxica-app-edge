import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/_index";

export function meta(_: Route.MetaArgs) {
	return [{ name: "description", content: "Welcome!" }];
}

export function loader({ context }: Route.LoaderArgs) {
	const env =
		(context as unknown as { cloudflare?: { env?: Record<string, string> } })
			?.cloudflare?.env ?? {};
	return { message: env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
	return <Welcome message={loaderData.message} />;
}
