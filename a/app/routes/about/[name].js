import { useParams } from "react-router";

export default function AboutName() {
	const { name } = useParams();

	return (
		<div>
			<h1>About {name} (App)</h1>
			<p>This is the app about page for {name}.</p>
			<a href="/">Back to home</a>
		</div>
	);
}
