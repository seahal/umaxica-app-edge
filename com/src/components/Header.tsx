// ナビゲーションコンポーネントの責務: グローバルなナビゲーション機能を提供
// テストではこう確認する: 各リンクが正しいpathを持っているか、アクティブ状態が正しく設定されるかをテスト
import { Link, NavLink } from "react-router";

interface HeaderProps {
	codeName?: string;
}

export function Header({ codeName = "" }: HeaderProps) {
	const navItems = [
		{ to: "/", label: "Home" },
		{ to: "/about", label: "About" },
		{ to: "/services", label: "Services" },
		{ to: "/privacy", label: "Privacy" },
		{ to: "/contact", label: "Contact" },
	];

	return (
		<>
			<nav>
				{/* ヒーローセクション */}
				<Link to="/">
					<h1>{codeName}</h1>
				</Link>
				<ul>
					<NavLink to="sample">
						<li>sample</li>
					</NavLink>
					<NavLink to="about">
						<li>about</li>
					</NavLink>
				</ul>
			</nav>
		</>
	);
}
