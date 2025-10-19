import { Outlet } from "react-router";

export default function DecoratedLayout() {
	return (
		<>
			<h1>UMAXICA (DEV)</h1>
			<Outlet />
		</>
	);
}
