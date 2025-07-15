import { Style } from "hono/css";

export default function Page() {
	return (
		<div>
			<Style />
			<header>
				<h1>Umaxica(org, edge)</h1>
			</header>
			<hr />
			<p>Welcome to umaxica</p>
			<hr />
			<footer>
				<p>© umaxica</p>
			</footer>
		</div>
	);
}
