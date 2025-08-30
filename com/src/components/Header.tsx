// ナビゲーションコンポーネントの責務: グローバルなナビゲーション機能を提供
// テストではこう確認する: 各リンクが正しいpathを持っているか、アクティブ状態が正しく設定されるかをテスト
import { NavLink } from "react-router";

interface HeaderProps {
	codeName?: string;
	newsUrl?: string;
	docsUrl?: string;
	helpUrl?: string;
}

export function Header({
	codeName = "",
	newsUrl = "",
	docsUrl = "",
	helpUrl = "",
}: HeaderProps) {
	const _navItems = [
		{ to: "/", label: "Home" },
		{ to: "/about", label: "About" },
		{ to: "/services", label: "Services" },
		{ to: "/privacy", label: "Privacy" },
		{ to: "/contact", label: "Contact" },
	];

	return (
		<nav>
			{/* ヒーローセクション */}
			<a href="/">
				<h1>{codeName}</h1>
			</a>
			<ul>
				<NavLink to="sample">
					<li>sample</li>
				</NavLink>
				<NavLink to="about">
					<li>about</li>
				</NavLink>
				<a href={newsUrl} target="_blank">
					<li>news</li>
				</a>
				<a href={docsUrl} target="_blank">
					<li>docs</li>
				</a>
				<a href={helpUrl} target="_blank">
					<li>help</li>
				</a>
			</ul>
		</nav>
	);
}
