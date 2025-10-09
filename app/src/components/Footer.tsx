interface FooterProps {
	codeName?: string;
}

export function Footer({ codeName = "" }: FooterProps) {
	return (
		<footer style={{ textAlign: "center" }} className="p-6">
			<small>
				© {new Date().getFullYear()} {codeName}
			</small>
		</footer>
	);
}
