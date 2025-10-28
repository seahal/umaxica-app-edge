import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export const meta: Route.MetaFunction = () => {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
};

export default function Home() {
	return (
		<>
			<Welcome />

			<footer style={{ textAlign: "center" }} className="p-6 text-gray-500">
				<small>© {new Date().getFullYear()} umaxica</small>
			</footer>
		</>
	);
}
