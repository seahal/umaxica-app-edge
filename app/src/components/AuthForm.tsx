import { useState } from "react";
import {
	Button,
	Checkbox,
	Form,
	Input,
	Label,
	TextField,
} from "react-aria-components";

interface AuthFormProps {
	type: "login" | "signup";
	onSubmit?: (data: Record<string, string>) => void;
}

/**
 * 認証フォームコンポーネント（ログイン/新規登録）
 * React Aria の Form, TextField, Checkbox を使用
 */
export function AuthForm({ type, onSubmit }: AuthFormProps) {
	const [showPassword, setShowPassword] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [agreed, setAgreed] = useState(false);

	const isLogin = type === "login";

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const data: Record<string, string> = {
			email,
			password,
		};
		if (!isLogin) {
			data.name = name;
		}
		onSubmit?.(data);
	};

	return (
		<Form onSubmit={handleSubmit} className="space-y-4">
			{/* 新規登録の場合は名前入力 */}
			{!isLogin && (
				<TextField
					value={name}
					onChange={setName}
					isRequired
					className="space-y-2"
				>
					<Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
						名前
					</Label>
					<Input
						type="text"
						placeholder="山田太郎"
						className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
					/>
				</TextField>
			)}

			{/* メールアドレス入力 */}
			<TextField
				value={email}
				onChange={setEmail}
				isRequired
				className="space-y-2"
			>
				<Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
					メールアドレス
				</Label>
				<Input
					type="email"
					placeholder="example@umaxica.app"
					className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
				/>
			</TextField>

			{/* パスワード入力 */}
			<TextField
				value={password}
				onChange={setPassword}
				isRequired
				className="space-y-2"
			>
				<Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
					パスワード
				</Label>
				<div className="relative">
					<Input
						type={showPassword ? "text" : "password"}
						placeholder="8文字以上"
						className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
					/>
					{/* パスワード表示/非表示切り替えボタン */}
					<Button
						type="button"
						onPress={() => setShowPassword(!showPassword)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
					>
						{showPassword ? (
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>非表示</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
								/>
							</svg>
						) : (
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>表示</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							</svg>
						)}
					</Button>
				</div>
			</TextField>

			{/* ログインの場合：パスワードを忘れた */}
			{isLogin && (
				<div className="text-right">
					<a
						href="/auth/forgot-password"
						className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
					>
						パスワードをお忘れですか？
					</a>
				</div>
			)}

			{/* 新規登録の場合：利用規約への同意 */}
			{!isLogin && (
				<Checkbox
					isSelected={agreed}
					onChange={setAgreed}
					className="flex items-start gap-2 group"
				>
					<div className="flex items-center h-6">
						<div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded group-data-[selected]:bg-blue-500 group-data-[selected]:border-blue-500 flex items-center justify-center transition-colors">
							<svg
								className="w-3 h-3 text-white hidden group-data-[selected]:block"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>チェック</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={3}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
					</div>
					<span className="text-sm text-gray-600 dark:text-gray-400">
						<a
							href="/legal/terms"
							className="text-blue-500 hover:underline dark:text-blue-400"
						>
							利用規約
						</a>
						と
						<a
							href="/legal/privacy"
							className="text-blue-500 hover:underline dark:text-blue-400"
						>
							プライバシーポリシー
						</a>
						に同意します
					</span>
				</Checkbox>
			)}

			{/* 送信ボタン */}
			<Button
				type="submit"
				isDisabled={!isLogin && !agreed}
				className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 shadow-lg hover:shadow-xl"
			>
				{isLogin ? "ログイン" : "アカウントを作成"}
			</Button>
		</Form>
	);
}

interface SocialLoginButtonProps {
	provider: "google" | "twitter" | "github";
	onClick?: () => void;
}

/**
 * ソーシャルログインボタン
 * React Aria の Button を使用
 */
export function SocialLoginButton({
	provider,
	onClick,
}: SocialLoginButtonProps) {
	const configs = {
		google: {
			name: "Google",
			icon: (
				<svg className="w-5 h-5" viewBox="0 0 24 24">
					<title>Google</title>
					<path
						fill="currentColor"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="currentColor"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="currentColor"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="currentColor"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
			),
			bgColor:
				"bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700",
			textColor: "text-gray-900 dark:text-gray-100",
			borderColor: "border border-gray-300 dark:border-gray-600",
		},
		twitter: {
			name: "Twitter",
			icon: (
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<title>Twitter</title>
					<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
				</svg>
			),
			bgColor:
				"bg-black hover:bg-gray-900 dark:bg-gray-900 dark:hover:bg-black",
			textColor: "text-white",
			borderColor: "",
		},
		github: {
			name: "GitHub",
			icon: (
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<title>GitHub</title>
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
				</svg>
			),
			bgColor:
				"bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600",
			textColor: "text-white",
			borderColor: "",
		},
	};

	const config = configs[provider];

	return (
		<Button
			onPress={onClick}
			className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${config.bgColor} ${config.textColor} ${config.borderColor}`}
		>
			{config.icon}
			<span>{config.name}でログイン</span>
		</Button>
	);
}
