interface FooterProps {
	codeName?: string;
}

export function Footer({ codeName = "" }: FooterProps) {
	return (
		<footer style={{ textAlign: "center" }}>
			<small>
				© {new Date().getFullYear()} {codeName}.
			</small>
		</footer>
	);
}
