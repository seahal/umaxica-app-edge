import { Outlet, NavLink, Link, useLocation } from "react-router";
import type { Route } from "../../src/routes/+types/privacy";

// テストではこう確認する: Outlet が適切に機能し、ナビゲーションが表示されるかをテスト
export function meta(_: Route.MetaArgs) {
	return [
		{ title: "sample - Umaxica" },
		{
			name: "description",
			content:
				"Umaxicaのプライバシーポリシー、データ保護方針、および関連ドキュメントをご確認いただけます。",
		},
	];
}

export default function SampleLayout() {
	return (
		<div>
			sample
			<br />
			sampole
			<br />
			sampole
			<br />
			sampole
			<br />
			sampole
			<h1>aaaaaaa</h1>
			<Outlet />
		</div>
	);
}
