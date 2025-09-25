import { Link } from "react-router-dom";

interface HeaderProps {
	codeName?: string;
	apiServiceUrl?: string;
	edgeServiceUrl?: string;
	helpServiceUrl?: string;
	docsServiceUrl?: string;
	newsServiceUrl?: string;
}

export function Header({
	codeName = "",
	apiServiceUrl = "",
	edgeServiceUrl = "",
	helpServiceUrl = "",
	docsServiceUrl = "",
	newsServiceUrl = "",
}: HeaderProps) {
	return (
		<header className="p-4 border-b">
			<Link to="/">
				<h1 className="text-xl font-semibold">{codeName}</h1>
			</Link>
			<nav className="mt-2">
				<ul className="flex gap-4">
					<Link to="about">
						<li>about</li>
					</Link>
					<Link to="sample">
						<li>sample</li>
					</Link>
					<a href={`https://${newsServiceUrl}`} target="_blank" rel="noopener" >
						<li>news</li>
					</a>
					<a href={`https://${docsServiceUrl}`} target="_blank" rel="noopener">
						<li>docs</li>
					</a>
					<a href={`https://${helpServiceUrl}`} target="_blank" rel="noopener">
						<li>help</li>
					</a>
				</ul>
			</nav>
		</header>
	);
}
