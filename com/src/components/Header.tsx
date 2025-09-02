import { Link } from "react-router";

interface HeaderProps {
	codeName?: string;
	newsUrl?: string;
	docsUrl?: string;
	helpUrl?: string;
}

export function Header({
	codeName = "",
	newsUrl = "",
	docsUrl = "",
	helpUrl = "",
}: HeaderProps) {
	return (
		<header>
			<a href="/">
				<h1>{codeName}</h1>
			</a>
			<nav>
				<ul>
					<Link to="sample">
						<li>sample</li>
					</Link>
					<Link to="about">
						<li>about</li>
					</Link>
					<a href={newsUrl} target="_blank">
						<li>news</li>
					</a>
					<a href={docsUrl} target="_blank">
						<li>docs</li>
					</a>
					<a href={helpUrl} target="_blank">
						<li>help</li>
					</a>
				</ul>
			</nav>
		</header>
	);
}
