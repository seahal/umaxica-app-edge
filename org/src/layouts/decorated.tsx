import { Outlet, useRouteLoaderData } from "react-router";

import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import type { loader as rootLoader } from "../root";

type RootLoaderData = Awaited<ReturnType<typeof rootLoader>>;

export default function DecoratedLayout() {
	const loaderData = useRouteLoaderData("root") as RootLoaderData | undefined;

	const {
		codeName = "",
		newsUrl = "",
		docsUrl = "",
		helpUrl = "",
	} = loaderData ?? {};

	return (
		<>
			<Header
				codeName={codeName}
				newsUrl={newsUrl}
				docsUrl={docsUrl}
				helpUrl={helpUrl}
			/>
			<Outlet />
			<Footer codeName={codeName} />
		</>
	);
}
