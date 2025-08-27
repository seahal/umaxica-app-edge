// エラー処理ユーティリティ関数
// この部分はエラー処理支援の責務: 統一されたエラー処理機能を提供
// テストではこう確認する: 各関数が適切なエラー情報を返すかをテスト

/**
 * HTTPステータスコードからエラータイプを判定
 * この部分はエラー分類の責務: ステータスコードに基づいてエラーの種類を識別
 */
export function getErrorType(status: number): "client" | "server" | "unknown" {
	if (status >= 400 && status < 500) {
		return "client";
	} else if (status >= 500 && status < 600) {
		return "server";
	} else {
		return "unknown";
	}
}

/**
 * エラーの重要度を判定
 * この部分はエラー重要度判定の責務: エラーの深刻さレベルを決定
 */
export function getErrorSeverity(
	status: number,
): "low" | "medium" | "high" | "critical" {
	switch (status) {
		case 404:
		case 403:
			return "low";
		case 400:
		case 401:
		case 422:
			return "medium";
		case 500:
		case 502:
		case 504:
			return "high";
		case 503:
			return "critical";
		default:
			return "medium";
	}
}

/**
 * エラーメッセージの日本語化
 * この部分は多言語対応の責務: 英語のエラーメッセージを日本語に変換
 */
export function getJapaneseErrorMessage(
	status: number,
	originalMessage?: string,
): string {
	const commonMessages: Record<number, string> = {
		400: "リクエストが不正です。入力内容を確認してください。",
		401: "認証が必要です。ログインしてください。",
		403: "このページにアクセスする権限がありません。",
		404: "お探しのページは見つかりませんでした。",
		405: "許可されていない操作です。",
		408: "リクエストがタイムアウトしました。",
		409: "リクエストが競合しています。",
		422: "入力データに問題があります。",
		429: "リクエストが多すぎます。しばらく待ってから再試行してください。",
		500: "サーバーで内部エラーが発生しました。",
		502: "ゲートウェイエラーが発生しました。",
		503: "サービスが一時的に利用できません。",
		504: "ゲートウェイタイムアウトが発生しました。",
	};

	return (
		commonMessages[status] ||
		originalMessage ||
		"予期しないエラーが発生しました。"
	);
}

/**
 * エラーの推奨アクション
 * この部分はユーザー支援の責務: エラーに応じた適切な対処方法を提示
 */
export function getErrorAction(status: number): string {
	const actions: Record<number, string> = {
		400: "入力内容を確認して、再度お試しください。",
		401: "ログインページからログインしてください。",
		403: "管理者にお問い合わせください。",
		404: "URLを確認するか、ホームページから目的のページをお探しください。",
		405: "別の方法でアクセスしてください。",
		408: "インターネット接続を確認して、再度お試しください。",
		409: "しばらく待ってから再度お試しください。",
		422: "入力フォームの内容を確認してください。",
		429: "しばらく時間をおいてから再度お試しください。",
		500: "しばらく待ってから再度お試しください。問題が続く場合は、お問い合わせください。",
		502: "しばらく待ってから再度お試しください。",
		503: "メンテナンス中の可能性があります。しばらく待ってから再度アクセスしてください。",
		504: "インターネット接続を確認して、再度お試しください。",
	};

	return (
		actions[status] ||
		"時間をおいて再度お試しください。問題が続く場合は、お問い合わせフォームからご連絡ください。"
	);
}

/**
 * エラー情報をログ用にフォーマット
 * この部分はログ管理の責務: エラー情報を構造化してログに記録
 */
export interface ErrorLogEntry {
	timestamp: string;
	status: number;
	type: string;
	severity: string;
	message: string;
	url?: string;
	userAgent?: string;
	userId?: string;
}

export function formatErrorForLogging(
	error: Error | Response,
	additionalInfo: {
		url?: string;
		userAgent?: string;
		userId?: string;
	} = {},
): ErrorLogEntry {
	const timestamp = new Date().toISOString();

	if (error instanceof Response) {
		return {
			timestamp,
			status: error.status,
			type: getErrorType(error.status),
			severity: getErrorSeverity(error.status),
			message: error.statusText || "HTTP Error",
			...additionalInfo,
		};
	} else {
		return {
			timestamp,
			status: 500,
			type: "server",
			severity: "high",
			message: error.message,
			...additionalInfo,
		};
	}
}

/**
 * クライアントサイドエラー報告
 * この部分はエラー報告の責務: クライアントで発生したエラーをサーバーに送信
 */
export async function reportClientError(
	error: Error,
	context: {
		url?: string;
		userAgent?: string;
		userId?: string;
		component?: string;
	} = {},
): Promise<void> {
	try {
		const errorData = {
			...formatErrorForLogging(error, context),
			component: context.component,
			stackTrace: error.stack,
		};

		// 実際の実装では、エラー報告APIエンドポイントに送信
		// await fetch('/api/errors', {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify(errorData)
		// });

		// 開発環境では、コンソールにログ出力
		if (typeof window !== "undefined" && import.meta.env.DEV) {
			console.error("Client Error Report:", errorData);
		}
	} catch (reportingError) {
		// エラー報告に失敗した場合でも、アプリケーションを停止させない
		console.warn("Failed to report error:", reportingError);
	}
}

/**
 * エラーの再試行判定
 * この部分は再試行制御の責務: エラーが再試行可能かどうかを判定
 */
export function shouldRetry(status: number, attemptCount: number = 0): boolean {
	const maxRetries = 3;

	if (attemptCount >= maxRetries) {
		return false;
	}

	// 再試行可能なエラーコード
	const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

	return retryableStatusCodes.includes(status);
}

/**
 * 再試行までの遅延時間計算（指数バックオフ）
 * この部分は再試行制御の責務: 適切な再試行間隔を計算
 */
export function getRetryDelay(attemptCount: number): number {
	// 指数バックオフ: 2^attemptCount * 1000ms (最大30秒)
	return Math.min(2 ** attemptCount * 1000, 30000);
}
