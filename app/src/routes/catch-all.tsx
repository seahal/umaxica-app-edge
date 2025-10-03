import { NotFoundPage } from "../components/NotFoundPage";
import type { Route } from "./+types/catch-all";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "404 - ページが見つかりません | UMAXICA" },
		{
			name: "description",
			content:
				"お探しのページは見つかりませんでした。URLを確認するか、ホームページから目的のページをお探しください。",
		},
		{ name: "robots", content: "noindex, nofollow" },
	];
}

export function loader(_: Route.LoaderArgs) {
	throw new Response("Not Found", {
		status: 404,
		statusText: "ページが見つかりません",
	});
}

export default function CatchAll() {
	return <NotFoundPage />;
}
