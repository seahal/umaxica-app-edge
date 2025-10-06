import { NavLink, useMatches } from "react-router";
import type { ReactNode } from "react";
import type { UIMatch } from "react-router";

type BreadcrumbHandle = {
	breadcrumb?: ReactNode | ((match: UIMatch) => ReactNode);
	titleName?: string;
};

type BreadcrumbItem = {
	id: string;
	label: ReactNode;
	to: string;
};

const HOME_PATH = "/";

function resolveBreadcrumb(match: UIMatch): BreadcrumbItem | null {
	const handle = match.handle as BreadcrumbHandle | undefined;
	const label = (() => {
		if (!handle) {
			return match.pathname === HOME_PATH ? "Home" : null;
		}
		if (handle.breadcrumb) {
			return typeof handle.breadcrumb === "function"
				? handle.breadcrumb(match)
				: handle.breadcrumb;
		}
		if (handle.titleName) {
			return handle.titleName;
		}
		return match.pathname === HOME_PATH ? "Home" : null;
	})();

	if (!label) {
		return null;
	}

	const to = match.pathname ?? match.pathnameBase ?? HOME_PATH;
	return {
		id: match.id,
		label,
		to,
	};
}

export function Breadcrumb() {
	const matches = useMatches();
	const breadcrumbs = matches.reduce<BreadcrumbItem[]>((acc, match) => {
		const item = resolveBreadcrumb(match);
		if (item) {
			acc.push(item);
		}
		return acc;
	}, []);

	const hasRootMatch = matches.some((match) => match.pathname === HOME_PATH);
	if (
		breadcrumbs.length > 0 &&
		breadcrumbs[0]?.to !== HOME_PATH &&
		hasRootMatch
	) {
		breadcrumbs.unshift({
			id: "__breadcrumb-home",
			label: "Home",
			to: HOME_PATH,
		});
	}

	if (breadcrumbs.length === 0) {
		return null;
	}

	return (
		<nav aria-label="breadcrumb" className="px-4 py-2 text-sm">
			<ol className="flex flex-wrap items-center gap-2 text-slate-600">
				{breadcrumbs.map((item, index) => {
					const isLast = index === breadcrumbs.length - 1;
					return (
						<li key={item.id} className="flex items-center gap-2">
							{isLast ? (
								<span
									aria-current="page"
									className="font-medium text-slate-900"
								>
									{item.label}
								</span>
							) : (
								<NavLink to={item.to} className="hover:underline">
									{item.label}
								</NavLink>
							)}
							{!isLast && <span aria-hidden="true">/</span>}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
