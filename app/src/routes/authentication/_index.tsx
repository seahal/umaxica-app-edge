import { Tab, TabList, TabPanel, Tabs } from "react-aria-components";
import type { Route } from "../+types/home";
import { AuthForm, SocialLoginButton } from "../../components/AuthForm";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Umaxica - ログイン" },
		{ name: "description", content: "Umaxica にログインまたは新規登録" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	return {
		message: (context.cloudflare.env as Env & { VALUE_FROM_CLOUDFLARE: string })
			.VALUE_FROM_CLOUDFLARE,
	};
}

export default function Authentication(_: Route.ComponentProps) {
	// フォーム送信時の処理（デモ用）
	const handleAuthSubmit = (data: Record<string, string>) => {
		console.log("認証データ:", data);
		alert(
			`${data.name ? "新規登録" : "ログイン"}が送信されました！\n（実際には認証APIに接続します）`,
		);
	};

	// ソーシャルログインの処理（デモ用）
	const handleSocialLogin = (provider: string) => {
		console.log(`${provider}でログイン`);
		alert(`${provider}認証に接続します！\n（実際にはOAuth認証を行います）`);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				{/* ロゴ・ヘッダー部分 */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
						<svg
							className="w-10 h-10 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Umaxica</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
							/>
						</svg>
					</div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
						Umaxica へようこそ
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						今何してる？を共有しよう
					</p>
				</div>

				{/* 認証カード */}
				<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
					{/* React Aria の Tabs でログイン/新規登録を切り替え */}
					<Tabs>
						<TabList className="flex border-b border-gray-200 dark:border-gray-800">
							<Tab
								id="login"
								className="flex-1 px-6 py-4 font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 data-[selected]:text-blue-500 data-[selected]:border-b-4 data-[selected]:border-blue-500"
							>
								ログイン
							</Tab>
							<Tab
								id="signup"
								className="flex-1 px-6 py-4 font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 data-[selected]:text-blue-500 data-[selected]:border-b-4 data-[selected]:border-blue-500"
							>
								新規登録
							</Tab>
						</TabList>

						{/* ログインタブ */}
						<TabPanel id="login" className="p-6">
							<AuthForm type="login" onSubmit={handleAuthSubmit} />

							{/* または区切り線 */}
							<div className="relative my-6">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-300 dark:border-gray-700" />
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
										または
									</span>
								</div>
							</div>

							{/* ソーシャルログインボタン */}
							<div className="space-y-3">
								<SocialLoginButton
									provider="google"
									onClick={() => handleSocialLogin("Google")}
								/>
								<SocialLoginButton
									provider="twitter"
									onClick={() => handleSocialLogin("Twitter")}
								/>
								<SocialLoginButton
									provider="github"
									onClick={() => handleSocialLogin("GitHub")}
								/>
							</div>
						</TabPanel>

						{/* 新規登録タブ */}
						<TabPanel id="signup" className="p-6">
							<AuthForm type="signup" onSubmit={handleAuthSubmit} />

							{/* または区切り線 */}
							<div className="relative my-6">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-300 dark:border-gray-700" />
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
										または
									</span>
								</div>
							</div>

							{/* ソーシャルログインボタン */}
							<div className="space-y-3">
								<SocialLoginButton
									provider="google"
									onClick={() => handleSocialLogin("Google")}
								/>
								<SocialLoginButton
									provider="twitter"
									onClick={() => handleSocialLogin("Twitter")}
								/>
								<SocialLoginButton
									provider="github"
									onClick={() => handleSocialLogin("GitHub")}
								/>
							</div>
						</TabPanel>
					</Tabs>
				</div>

				{/* フッター */}
				<div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
					<p>
						外部の認証サービス（
						<a
							href="https://auth.umaxica.app"
							className="text-blue-500 hover:underline dark:text-blue-400"
							rel="noopener"
						>
							auth.umaxica.app
						</a>
						）に接続します
					</p>
				</div>
			</div>
		</div>
	);
}
