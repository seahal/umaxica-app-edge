import { NavLink, Link } from "react-router";

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
			<Link to="/">
				<h1 className="text-xl font-semibold">{codeName}</h1>
			</Link>
			<nav className="mt-2">
				<ul className="flex gap-4">
					<NavLink to="about">
						<li>about</li>
					</NavLink>
					<NavLink to="sample">
						<li>sample</li>
					</NavLink>
					<a
						href={newsUrl ? `https://${newsUrl}` : "#"}
						target="_blank"
						rel="noopener noreferrer"
					>
						<li>news</li>
					</a>
					<a
						href={docsUrl ? `https://${docsUrl}` : "#"}
						target="_blank"
						rel="noopener noreferrer"
					>
						<li>docs</li>
					</a>
					<a
						href={helpUrl ? `https://${helpUrl}` : "#"}
						target="_blank"
						rel="noopener noreferrer"
					>
						<li>help</li>
					</a>
				</ul>
			</nav>
		</header>
	);
}
