import { useParams } from "react-router";

export default function BlogContentName() {
	const { name } = useParams();

	return (
		<article>
			<h1>
				{name.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())} (App)
			</h1>
			<p>This is the app blog post content for "{name}".</p>
			<p>
				App-specific content: Lorem ipsum dolor sit amet, consectetur adipiscin
				elit
			</p>
		</article>
	);
}
