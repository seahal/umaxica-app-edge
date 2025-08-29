interface FooterProps {
	codeName?: string;
}

export function Footer({ codeName = "" }: FooterProps) {
	return (
		<footer style={{ textAlign: "center" }}>
			<small>© {codeName}.</small>
		</footer>
	);
}
