import { Link } from "react-router";
import type { Route } from "./+types/index";

// メタ情報の責務: プライバシー概要ページのSEO対応メタデータを定義
// テストではこう確認する: titleとdescriptionが適切に設定されるかをテスト
export function meta(_: Route.MetaArgs) {
	return [
		{ title: "プライバシー概要 - Umaxica" },
		{
			name: "description",
			content:
				"Umaxicaの個人情報保護への取り組みと、プライバシーポリシーの概要をご紹介します。",
		},
	];
}

// プライバシー概要ページのメインコンポーネント
// この部分はプライバシー情報表示の責務: プライバシー関連情報の概要とナビゲーションを提供
// テストではこう確認する: 各セクションが適切に表示され、リンクが正しく機能するかをテスト
export default function SampleIndex() {
	return (
		<div>
			aa bb cc dd ee ff gg hh ii jj kk
			<ol>
				<li>ll</li>
			</ol>
			ll
		</div>
	);
}
