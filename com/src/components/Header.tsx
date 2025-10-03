import { NavLink, Link } from "react-router";

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
		<header className="p-4 border-b">
			<Link to="/">
				<h1 className="text-xl font-semibold">{codeName} (Com)</h1>
			</Link>
			<nav className="mt-2">
				<ul className="flex gap-4">
					<NavLink to="about">
						<li>About</li>
					</NavLink>
					<NavLink to="sample">
						<li>Sample</li>
					</NavLink>
					<NavLink to="configure">
						<li>Configure</li>
					</NavLink>
					<a
						href={newsUrl ? `https://${newsUrl}` : "#"}
						target="_blank"
						rel="noopener noreferrer"
					>
						<li>News</li>
					</a>
					<a
						href={docsUrl ? `https://${docsUrl}` : "#"}
						target="_blank"
						rel="noopener noreferrer"
					>
						<li>Docs</li>
					</a>
					<a
						href={helpUrl ? `https://${helpUrl}` : "#"}
						target="_blank"
						rel="noopener noreferrer"
					>
						<li>Help</li>
					</a>
				</ul>
			</nav>
		</header>
	);
}
