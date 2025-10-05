import { ErrorPage } from "../components/ErrorPage";

type Props = {
	details?: string;
	stack?: string;
	showDetails?: boolean;
};

export function InternalServerErrorPage({
	details,
	stack,
	showDetails = false,
}: Props) {
	return (
		<ErrorPage
			status={500}
			title="サーバーエラー"
			message="申し訳ございません。サーバーで予期しないエラーが発生しました。"
			suggestion="しばらく時間をおいて再度お試しください。問題が継続する場合は、お問い合わせフォームからご連絡ください。"
			showNavigation={true}
			showDetails={showDetails}
			details={details}
			stack={stack}
		/>
	);
}
