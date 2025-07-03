import { Style } from "hono/css";

const Nav = () => (
	<nav>
		<a href="/">Home</a> | <a href="/about">About</a> |{" "}
		<a href="/contact">Contact</a>
	</nav>
);

export default function Page() {
	return (
		<div>
			<Style />
			<header>
				<h1>Umaxica(app, edge)</h1>
			</header>
			<hr />
			<Nav />
			<h2>Welcome to umaxica</h2>
			<p>This is the home page.</p>
			<hr />
			<footer>
				<p>© umaxica</p>
			</footer>
		</div>
	);
}
