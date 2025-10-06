import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/_index";

export const handle = {
	titleName: "Home",
	breadcrumb: () => "Home",
};

export function meta(_: Route.MetaArgs) {
	return [{ name: "description", content: "Welcome!" }];
}

type LoaderContext = {
	cloudflare?: {
		env?: Partial<Env> & { VALUE_FROM_CLOUDFLARE?: string };
	};
};

export function loader({ context }: Route.LoaderArgs) {
	const loaderContext = context as LoaderContext;
	const message = loaderContext.cloudflare?.env?.VALUE_FROM_CLOUDFLARE ?? "";

	return { message };
}

export default function Home({ loaderData }: Route.ComponentProps) {
	return <Welcome message={loaderData.message} />;
}
