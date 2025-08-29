import { useActionState, useId, useOptimistic } from "react";
import type { Route } from "./+types/contact";

// メタ情報の責務: Contact ページのSEO対応メタデータを定義
// テストではこう確認する: title と description が正しく設定されるかをテスト
export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Contact - Umaxica" },
		{
			name: "description",
			content:
				"Umaxicaへのお問い合わせはこちらから。プロジェクトのご相談、お見積もり、その他ご質問がございましたらお気軽にご連絡ください。",
		},
	];
}

// フォームデータ型定義
// この部分はデータ構造の責務: フォーム入力データの型安全性を保証
type ContactFormData = {
	name: string;
	email: string;
	company: string;
	message: string;
	category: string;
};

type ActionState = {
	success: boolean;
	errors: Record<string, string>;
	data: ContactFormData | null;
	message: string;
};

// サーバーアクション（React 19の action 機能）
// この部分はフォーム送信の責務: お問い合わせフォームの送信処理を実行
// テストではこう確認する: フォームデータが正しく処理され、適切なレスポンスが返されるかをテスト
export async function action({ request }: Route.ActionArgs) {
	try {
		const formData = await request.formData();

		const contactData: ContactFormData = {
			name: formData.get("name") as string,
			email: formData.get("email") as string,
			company: formData.get("company") as string,
			message: formData.get("message") as string,
			category: formData.get("category") as string,
		};

		// バリデーション
		const errors: Record<string, string> = {};

		if (!contactData.name?.trim()) {
			errors.name = "お名前は必須です";
		}

		if (!contactData.email?.trim()) {
			errors.email = "メールアドレスは必須です";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
			errors.email = "有効なメールアドレスを入力してください";
		}

		if (!contactData.message?.trim()) {
			errors.message = "お問い合わせ内容は必須です";
		}

		// バリデーションエラーがある場合
		if (Object.keys(errors).length > 0) {
			// バリデーションエラーは422 Unprocessable Entity として処理
			throw new Response(
				JSON.stringify({ success: false, errors, data: contactData }),
				{
					status: 422,
					statusText: "入力データに問題があります",
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// 実際の送信処理をシミュレート（実際にはメール送信やAPI呼び出しを行う）
		try {
			await new Promise((resolve, reject) => {
				setTimeout(() => {
					// 稀にエラーをシミュレート（テスト用）
					if (Math.random() < 0.05) {
						// 5%の確率でエラー
						reject(new Error("メール送信サービスエラー"));
					} else {
						resolve(undefined);
					}
				}, 1000);
			});
		} catch (sendError) {
			console.error("Contact form send error:", sendError);
			throw new Response("Service Temporarily Unavailable", {
				status: 503,
				statusText: "メール送信サービスが一時的に利用できません",
			});
		}

		// 成功レスポンス
		return {
			success: true,
			message: `${contactData.name}様、お問い合わせありがとうございました。2営業日以内にご返信いたします。`,
			data: null,
			errors: {},
		};
	} catch (error) {
		// 既にResponseエラーの場合はそのまま再スロー
		if (error instanceof Response) {
			throw error;
		}

		// その他の予期しないエラー
		console.error("Contact form action error:", error);
		throw new Response("Internal Server Error", {
			status: 500,
			statusText: "お問い合わせフォームの処理中にエラーが発生しました",
		});
	}
}

// お問い合わせフォームコンポーネント（React 19の useActionState と useOptimistic を使用）
// この部分はフォーム管理の責務: フォーム状態管理と楽観的更新を提供
// テストではこう確認する: フォーム送信、バリデーション、エラー表示が正しく動作するかをテスト
function ContactForm() {
	const idBase = useId();
	const [state, submitAction, isPending] = useActionState<
		ActionState,
		FormData
	>(
		async (_prevState: ActionState, formData: FormData) => {
			// この部分でサーバーアクションを呼び出すシミュレーション
			const contactData: ContactFormData = {
				name: formData.get("name") as string,
				email: formData.get("email") as string,
				company: formData.get("company") as string,
				message: formData.get("message") as string,
				category: formData.get("category") as string,
			};

			// 簡単なバリデーション
			const errors: Record<string, string> = {};
			if (!contactData.name?.trim()) errors.name = "お名前は必須です";
			if (!contactData.email?.trim()) errors.email = "メールアドレスは必須です";
			if (!contactData.message?.trim())
				errors.message = "お問い合わせ内容は必須です";

			if (Object.keys(errors).length > 0) {
				return { success: false, errors, data: contactData };
			}

			// 送信成功をシミュレート
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return {
				success: true,
				message: `${contactData.name}様、お問い合わせありがとうございました。`,
				errors: {},
				data: null,
			};
		},
		{ success: false, errors: {}, data: null, message: "" },
	);

	// 楽観的更新用の状態
	const [optimisticState, addOptimistic] = useOptimistic(
		state,
		(currentState, optimisticValue: { success: boolean; message: string }) => ({
			...currentState,
			...optimisticValue,
		}),
	);

	const categories = [
		{ value: "", label: "お問い合わせ種別を選択" },
		{ value: "web-development", label: "Webアプリケーション開発" },
		{ value: "cloud-solutions", label: "クラウドソリューション" },
		{ value: "data-analytics", label: "データ分析・AI" },
		{ value: "consulting", label: "コンサルティング" },
		{ value: "other", label: "その他" },
	];

	return (
		<div className="bg-white rounded-lg shadow-md p-8">
			<form
				action={submitAction}
				onSubmit={(e) => {
					// 楽観的更新
					const formData = new FormData(e.currentTarget);
					const name = formData.get("name") as string;
					addOptimistic({
						success: true,
						message: `${name}様、送信中です...`,
					});
				}}
			>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					{/* お名前フィールド */}
					<div className="sm:col-span-1">
						<label
							htmlFor={`${idBase}-name`}
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							お名前 <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							name="name"
							id={`${idBase}-name`}
							defaultValue={state.data?.name || ""}
							className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
								state.errors?.name ? "border-red-500" : "border-gray-300"
							}`}
							placeholder="山田 太郎"
						/>
						{state.errors?.name && (
							<p className="mt-1 text-sm text-red-600">{state.errors.name}</p>
						)}
					</div>

					{/* メールアドレスフィールド */}
					<div className="sm:col-span-1">
						<label
							htmlFor={`${idBase}-email`}
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							メールアドレス <span className="text-red-500">*</span>
						</label>
						<input
							type="email"
							name="email"
							id={`${idBase}-email`}
							defaultValue={state.data?.email || ""}
							className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
								state.errors?.email ? "border-red-500" : "border-gray-300"
							}`}
							placeholder="example@company.com"
						/>
						{state.errors?.email && (
							<p className="mt-1 text-sm text-red-600">{state.errors.email}</p>
						)}
					</div>

					{/* 会社名フィールド */}
					<div className="sm:col-span-1">
						<label
							htmlFor={`${idBase}-company`}
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							会社名
						</label>
						<input
							type="text"
							name="company"
							id={`${idBase}-company`}
							defaultValue={state.data?.company || ""}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
							placeholder="株式会社サンプル"
						/>
					</div>

					{/* お問い合わせ種別 */}
					<div className="sm:col-span-1">
						<label
							htmlFor={`${idBase}-category`}
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							お問い合わせ種別
						</label>
						<select
							name="category"
							id={`${idBase}-category`}
							defaultValue={state.data?.category || ""}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
						>
							{categories.map((category) => (
								<option key={category.value} value={category.value}>
									{category.label}
								</option>
							))}
						</select>
					</div>

					{/* お問い合わせ内容 */}
					<div className="sm:col-span-2">
						<label
							htmlFor={`${idBase}-message`}
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							お問い合わせ内容 <span className="text-red-500">*</span>
						</label>
						<textarea
							name="message"
							id={`${idBase}-message`}
							rows={6}
							defaultValue={state.data?.message || ""}
							className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
								state.errors?.message ? "border-red-500" : "border-gray-300"
							}`}
							placeholder="プロジェクトの詳細やご要望をお聞かせください..."
						/>
						{state.errors?.message && (
							<p className="mt-1 text-sm text-red-600">
								{state.errors.message}
							</p>
						)}
					</div>
				</div>

				{/* 送信ボタン */}
				<div className="mt-8">
					<button
						type="submit"
						disabled={isPending}
						className={`w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-md transition duration-200 ${
							isPending ? "cursor-not-allowed" : "cursor-pointer"
						}`}
					>
						{isPending ? "送信中..." : "送信する"}
					</button>
				</div>

				{/* 成功・エラーメッセージ */}
				{optimisticState.success && optimisticState.message && (
					<div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
						<p className="text-green-800">{optimisticState.message}</p>
					</div>
				)}
			</form>
		</div>
	);
}

// Contact ページメインコンポーネント
// この部分はページ全体構成の責務: Contact ページの全体的なレイアウトを定義
// テストではこう確認する: 全セクションが正しくレンダリングされ、フォームコンポーネントが適切に動作するかをテスト
export default function Contact() {
	return (
		<div className="bg-gray-50 min-h-screen">
			{/* ヒーローセクション */}
			<div className="bg-white py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
							お問い合わせ
						</h1>
						<p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
							プロジェクトのご相談、お見積もり、その他ご質問がございましたら、
							お気軽にお問い合わせください。専門スタッフが丁寧に対応いたします。
						</p>
					</div>
				</div>
			</div>

			<div className="py-16">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
						{/* お問い合わせフォーム */}
						<div className="lg:col-span-2">
							<h2 className="text-2xl font-bold text-gray-900 mb-6">
								お問い合わせフォーム
							</h2>
							<ContactForm />
						</div>

						{/* 会社情報・連絡先 */}
						<div className="lg:col-span-1">
							<div className="bg-white rounded-lg shadow-md p-8">
								<h3 className="text-xl font-bold text-gray-900 mb-6">
									会社情報
								</h3>

								{/* この部分は連絡先情報の責務: 会社の基本的な連絡先情報を表示 */}
								<div className="space-y-6">
									<div>
										<h4 className="font-semibold text-gray-900 mb-2">
											📍 本社所在地
										</h4>
										<p className="text-gray-600">
											〒100-0001
											<br />
											東京都千代田区千代田1-1-1
											<br />
											千代田ビル10F
										</p>
									</div>

									<div>
										<h4 className="font-semibold text-gray-900 mb-2">
											📞 電話番号
										</h4>
										<p className="text-gray-600">03-1234-5678</p>
									</div>

									<div>
										<h4 className="font-semibold text-gray-900 mb-2">
											✉️ メールアドレス
										</h4>
										<p className="text-gray-600">info@umaxica.com</p>
									</div>

									<div>
										<h4 className="font-semibold text-gray-900 mb-2">
											🕒 営業時間
										</h4>
										<p className="text-gray-600">
											平日 9:00 - 18:00
											<br />
											（土日祝日は休業）
										</p>
									</div>

									<div>
										<h4 className="font-semibold text-gray-900 mb-2">
											⏱️ レスポンス時間
										</h4>
										<p className="text-gray-600 text-sm">
											お問い合わせいただいてから
											<br />
											2営業日以内にご返信いたします
										</p>
									</div>
								</div>
							</div>

							{/* その他の連絡方法 */}
							<div className="bg-blue-50 rounded-lg p-6 mt-6">
								<h3 className="text-lg font-bold text-blue-900 mb-4">
									その他の連絡方法
								</h3>
								<div className="space-y-3 text-sm">
									<p className="text-blue-800">
										<strong>緊急時:</strong> 090-1234-5678
										<br />
										<span className="text-blue-600">
											（営業時間外の緊急対応）
										</span>
									</p>
									<p className="text-blue-800">
										<strong>採用について:</strong> recruit@umaxica.com
									</p>
									<p className="text-blue-800">
										<strong>プレス・メディア:</strong> press@umaxica.com
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
