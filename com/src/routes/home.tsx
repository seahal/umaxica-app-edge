import type { Route } from "../../src/routes/+types/home";
import { Suspense } from "react";

// メタ情報の責務: SEO対応のためのページメタデータを定義
// テストではこう確認する: title と description が正しく設定されるかをテスト
export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Umaxica - 革新的なソリューションをお届けします" },
		{
			name: "description",
			content:
				"Umaxicaは最先端のテクノロジーでビジネスの課題を解決します。お客様のニーズに合わせたカスタムソリューションを提供いたします。",
		},
	];
}

// データローダーの責務: ページ表示に必要なデータを事前に読み込み
// テストではこう確認する: 環境変数が正しく取得され、適切なデータが返されるかをテスト
export function loader({ context }: Route.LoaderArgs) {
	try {
		const companyMessage =
			context.cloudflare.env.VALUE_FROM_CLOUDFLARE || "Welcome to Umaxica";

		return {
			message: companyMessage,
			stats: {
				projectsCompleted: 500,
				clientsSatisfied: 150,
				yearsOfExperience: 10,
			},
		};
	} catch (error) {
		// ローダーでエラーが発生した場合は500エラーとして処理
		console.error("Home loader error:", error);
		throw new Response("Internal Server Error", {
			status: 500,
			statusText: "データの読み込み中にエラーが発生しました",
		});
	}
}

// React 19のSuspenseとuse()を使用したコンポーネント
// この部分はコンテンツ表示の責務: ヒーロセクション、統計情報、サービス紹介を表示
// テストではこう確認する: loaderDataが正しく表示され、統計情報が適切にレンダリングされるかをテスト
export default function Home({ loaderData }: Route.ComponentProps) {
	return (
		<div className="bg-white">
			{/* ヒーローセクション */}
			<div className="relative bg-gradient-to-br from-blue-600 to-purple-700">
				<div className="absolute inset-0 bg-black opacity-20"></div>
				<div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
					<h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
						革新的なソリューションで
						<br />
						ビジネスを変革
					</h1>
					<p className="mt-6 max-w-3xl text-xl text-blue-100">
						{loaderData.message}
						<br />
						私たちは最先端のテクノロジーを活用し、お客様のビジネスの成長と成功をサポートします。
					</p>
					<div className="mt-10">
						<button
							type="button"
							className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold text-lg transition duration-200"
						>
							詳しく見る
						</button>
					</div>
				</div>
			</div>

			{/* 統計セクション */}
			<div className="bg-gray-50 py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h2 className="text-3xl font-extrabold text-gray-900">
							実績で証明される信頼性
						</h2>
						<p className="mt-4 text-xl text-gray-600">
							多くのお客様に選ばれ続けている理由がここにあります。
						</p>
					</div>
					<div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
						<Suspense
							fallback={
								<div className="animate-pulse bg-gray-200 h-20 rounded"></div>
							}
						>
							<div className="text-center">
								<div className="text-4xl font-bold text-blue-600">
									{loaderData.stats.projectsCompleted}+
								</div>
								<div className="mt-2 text-lg text-gray-900">
									完了プロジェクト
								</div>
							</div>
						</Suspense>
						<Suspense
							fallback={
								<div className="animate-pulse bg-gray-200 h-20 rounded"></div>
							}
						>
							<div className="text-center">
								<div className="text-4xl font-bold text-blue-600">
									{loaderData.stats.clientsSatisfied}+
								</div>
								<div className="mt-2 text-lg text-gray-900">
									満足いただいたお客様
								</div>
							</div>
						</Suspense>
						<Suspense
							fallback={
								<div className="animate-pulse bg-gray-200 h-20 rounded"></div>
							}
						>
							<div className="text-center">
								<div className="text-4xl font-bold text-blue-600">
									{loaderData.stats.yearsOfExperience}
								</div>
								<div className="mt-2 text-lg text-gray-900">年の実績</div>
							</div>
						</Suspense>
					</div>
				</div>
			</div>

			{/* サービス紹介セクション */}
			<div className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h2 className="text-3xl font-extrabold text-gray-900">
							主要サービス
						</h2>
						<p className="mt-4 text-xl text-gray-600">
							お客様のニーズに合わせた幅広いソリューションを提供します。
						</p>
					</div>
					<div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{/* サービスカードの責務: 各サービスの概要を視覚的に表示 */}
						{[
							{
								title: "Webアプリケーション開発",
								description:
									"React、Next.jsを使用したモダンなWebアプリケーションの開発",
								icon: "🚀",
							},
							{
								title: "クラウドソリューション",
								description:
									"AWS、Cloudflareを活用したスケーラブルなクラウド環境の構築",
								icon: "☁️",
							},
							{
								title: "データ分析・AI",
								description:
									"機械学習とデータサイエンスでビジネスインサイトを提供",
								icon: "🤖",
							},
						].map((service) => (
							<div
								key={service.title}
								className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
							>
								<div className="text-4xl mb-4">{service.icon}</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									{service.title}
								</h3>
								<p className="text-gray-600">{service.description}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
