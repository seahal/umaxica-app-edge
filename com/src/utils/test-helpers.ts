// テストヘルパー関数
// この部分はテスト支援機能の責務: テスト実行を支援する共通関数を提供
// テストではこう確認する: ヘルパー関数が期待通りに動作するかをテスト

/**
 * メタデータから特定のプロパティを取得するヘルパー
 * この部分はメタデータ操作の責務: メタデータ配列から特定の要素を安全に取得
 */
export function getMetaProperty(
	meta: any[],
	property: string,
	key?: string,
): string | undefined {
	if (key) {
		const item = meta.find((m) => m[property] && m[key]);
		return item?.[property];
	}
	const item = meta.find((m) => m[property]);
	return item?.[property];
}

/**
 * メタデータからタイトルを取得
 * この部分はSEO支援の責務: ページタイトルの取得を簡略化
 */
export function getTitle(meta: any[]): string | undefined {
	return getMetaProperty(meta, "title");
}

/**
 * メタデータから説明文を取得
 * この部分はSEO支援の責務: ページ説明文の取得を簡略化
 */
export function getDescription(meta: any[]): string | undefined {
	const item = meta.find((m) => m.name === "description");
	return item?.content;
}

/**
 * 文字列の長さがSEO的に適切かチェック
 * この部分はSEO検証の責務: タイトルや説明文の長さをSEO基準で検証
 */
export function isValidSEOLength(
	text: string,
	type: "title" | "description",
): boolean {
	if (type === "title") {
		return text.length >= 10 && text.length <= 60;
	} else {
		return text.length >= 20 && text.length <= 200;
	}
}

/**
 * 日本語文字列かどうかをチェック
 * この部分は多言語対応の責務: 日本語コンテンツの検証を支援
 */
export function containsJapanese(text: string): boolean {
	const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
	return japaneseRegex.test(text);
}

/**
 * モックデータ生成のヘルパー
 * この部分はテストデータ生成の責務: 一貫したテストデータの提供
 */
export function createMockCloudflareContext(
	overrides: Record<string, any> = {},
) {
	return {
		cloudflare: {
			env: {
				VALUE_FROM_CLOUDFLARE: "Test Environment Message",
				...overrides,
			},
			cf: {},
			ctx: { waitUntil: () => {} },
		},
	};
}

/**
 * サービスデータの検証
 * この部分はデータ検証の責務: サービス情報の完整性を確認
 */
export function validateServiceData(service: any): boolean {
	const requiredFields = [
		"id",
		"title",
		"category",
		"description",
		"features",
		"technologies",
		"price",
		"duration",
	];

	return requiredFields.every((field) => {
		const value = service[field];
		if (field === "features" || field === "technologies") {
			return Array.isArray(value) && value.length > 0;
		}
		return typeof value === "string" && value.length > 0;
	});
}

/**
 * フォームデータの検証
 * この部分はフォーム検証の責務: お問い合わせフォームデータの妥当性確認
 */
export function validateContactForm(formData: {
	name?: string;
	email?: string;
	message?: string;
	company?: string;
}): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!formData.name?.trim()) {
		errors.push("お名前は必須です");
	}

	if (!formData.email?.trim()) {
		errors.push("メールアドレスは必須です");
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
		errors.push("有効なメールアドレスを入力してください");
	}

	if (!formData.message?.trim()) {
		errors.push("お問い合わせ内容は必須です");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * 統計データの妥当性チェック
 * この部分は統計検証の責務: 表示する統計情報の妥当性を確認
 */
export function validateStatsData(stats: any): boolean {
	return (
		typeof stats === "object" &&
		stats !== null &&
		typeof stats.projectsCompleted === "number" &&
		typeof stats.clientsSatisfied === "number" &&
		typeof stats.yearsOfExperience === "number" &&
		stats.projectsCompleted > 0 &&
		stats.clientsSatisfied > 0 &&
		stats.yearsOfExperience > 0
	);
}
