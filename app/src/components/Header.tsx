import { Link } from "react-router-dom";

interface HeaderProps {
	newsUrl?: string;
	docsUrl?: string;
	helpUrl?: string;
	codeName?: string;
}

export function Header({
	newsUrl = "",
	docsUrl = "",
	helpUrl = "",
	codeName = "",
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

console.log(import.meta.env.VALUE_FROM_CLOUDFLARE);
console.log(import.meta.env.CODE_NAME);
console.log(import.meta.env);
