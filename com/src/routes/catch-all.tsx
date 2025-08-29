import { NotFoundPage } from "../components/NotFoundPage";
import type { Route } from "../../src/routes/+types/catch-all";

// メタ情報の責務: 404ページのSEO対応メタデータを定義
// テストではこう確認する: 404ページの適切なメタ情報が設定されるかをテスト
export function meta(_: Route.MetaArgs) {
	return [
		{ title: "404 - ページが見つかりません | Umaxica" },
		{
			name: "description",
			content:
				"お探しのページは見つかりませんでした。URLを確認するか、ホームページから目的のページをお探しください。",
		},
		// 404ページは検索エンジンにインデックスされないようにする
		{ name: "robots", content: "noindex, nofollow" },
	];
}

// ローダー関数の責務: 404エラーを明示的に投げる
// テストではこう確認する: 404ステータスが正しく返されるかをテスト
export function loader(_: Route.LoaderArgs) {
	// React Router に404エラーを通知
	throw new Response("Not Found", {
		status: 404,
		statusText: "ページが見つかりません",
	});
}

// キャッチオールコンポーネント（通常は実行されないが、フォールバックとして定義）
// この部分はフォールバック表示の責務: loader でエラーが投げられなかった場合の表示
// テストではこう確認する: このコンポーネントが適切にレンダリングされるかをテスト
export default function CatchAll() {
	// このコンポーネントは通常実行されない（loaderで404が投げられるため）
	// しかし、何らかの理由でloaderが実行されない場合のフォールバック
	return <NotFoundPage />;
}
