import { Link, NavLink } from "react-router-dom";

interface HeaderProps {
	codeName?: string;
	helpServiceUrl?: string;
	docsServiceUrl?: string;
	newsServiceUrl?: string;
}

export function Header({
	codeName = "",
	helpServiceUrl = "",
	docsServiceUrl = "",
	newsServiceUrl = "",
}: HeaderProps) {
	return (
		<header className="p-4 border-b">
			<Link>
				<h1 className="text-xl font-semibold">{codeName} (App)</h1>
			</Link>
			<nav className="mt-2">
				<ul className="flex gap-4">
					<NavLink to="search">
						<li>Search</li>
					</NavLink>
					<NavLink to="message">
						<li>Message</li>
					</NavLink>
					<NavLink to="notification">
						<li>Notification</li>
					</NavLink>
					<NavLink to="configuration">
						<li>Configuration</li>
					</NavLink>
					<a href={`https://${newsServiceUrl}`} target="_blank" rel="noopener">
						<li>News</li>
					</a>
					<a href={`https://${docsServiceUrl}`} target="_blank" rel="noopener">
						<li>Documents</li>
					</a>
					<a href={`https://${helpServiceUrl}`} target="_blank" rel="noopener">
						<li>Help</li>
					</a>
					<NavLink to="authentication">
						<li>Authentication</li>
					</NavLink>
				</ul>
			</nav>
		</header>
	);
}
