import { useParams } from "react-router";

export default function MerchSlug() {
	const { "*": slug } = useParams();
	const segments = slug ? slug.split("/") : [];

	return (
		<div>
			<h1>App Merch Page</h1>
			<p>Slug segments: {segments.join(" > ")}</p>
			<ul>
				<li>Category: {segments[0] || "N/A"}</li>
				<li>Item: {segments[1] || "N/A"}</li>
				<li>Variant: {segments[2] || "N/A"}</li>
			</ul>
		</div>
	);
}
