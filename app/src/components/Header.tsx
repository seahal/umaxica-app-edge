import { Link } from "react-router";

interface HeaderProps {
	codeName?: string;
	newsUrl?: string;
	docsUrl?: string;
	helpUrl?: string;
}

export function Header({
	codeName = "UMAXICA",
	newsUrl = "",
	docsUrl = "",
	helpUrl = "",
}: HeaderProps) {
	return (
		<header className="p-4 border-b">
			<a href="/">
				<h1 className="text-xl font-semibold">{codeName}</h1>
			</a>
			<nav className="mt-2">
				<ul className="flex gap-4">
					<Link to="about">
						<li>about</li>
					</Link>
					<Link to="sample">
						<li>sample</li>
					</Link>
					<a href={newsUrl} target="_blank" rel="noreferrer">
						<li>news</li>
					</a>
					<a href={docsUrl} target="_blank" rel="noreferrer">
						<li>docs</li>
					</a>
					<a href={helpUrl} target="_blank" rel="noreferrer">
						<li>help</li>
					</a>
				</ul>
			</nav>
		</header>
	);
}
