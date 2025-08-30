import { jsx as _jsx } from "react/jsx-runtime";
import { Welcome } from "../welcome/welcome";
export function meta(_) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}
export function loader({ context }) {
	return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}
export default function Home({ loaderData }) {
	return _jsx(Welcome, { message: loaderData.message });
}
