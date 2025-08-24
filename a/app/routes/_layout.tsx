import { Outlet } from "react-router";

export default function Layout() {
	return (
		<div>
			<nav>
				<a href="/">Home</a>
				<a href="/about/test">About</a>
				<a href="/blog">Blog</a>
			</nav>
			<main>
				<Outlet />
			</main>
		</div>
	);
}
