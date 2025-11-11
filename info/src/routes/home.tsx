import { DocsViewer } from "../components/DocsViewer";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => {
	return [
		{ title: "Umaxica Developers - ドキュメント" },
		{ name: "description", content: "React Aria Components のドキュメント" },
	];
};

export default function Home() {
	return <DocsViewer />;
}
