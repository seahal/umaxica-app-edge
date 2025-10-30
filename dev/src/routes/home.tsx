import type { Route } from "./+types/home";
import { DocsViewer } from "../components/DocsViewer";

export const meta: Route.MetaFunction = () => {
	return [
		{ title: "Umaxica Developers - ドキュメント" },
		{ name: "description", content: "React Aria Components のドキュメント" },
	];
};

export default function Home() {
	return <DocsViewer />;
}
