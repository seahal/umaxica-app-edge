import { describe, expect, it } from "bun:test";
import { Window } from "happy-dom";
import { renderToStaticMarkup } from "react-dom/server";

import { Footer } from "../../src/components/Footer";

type FooterProps = Parameters<typeof Footer>[0];

function renderFooter(props?: Partial<FooterProps>) {
	const markup = renderToStaticMarkup(
		<Footer {...((props ?? {}) as FooterProps)} />,
	);
	const window = new Window();
	window.document.body.innerHTML = markup;
	return window.document;
}

describe("Footer component", () => {
	it("renders a footer landmark with fallback branding when codeName is omitted", () => {
		const document = renderFooter();
		const footer = document.querySelector("footer");
		expect(footer).toBeTruthy();

		const heading = footer?.querySelector("h3");
		expect(heading?.textContent).toBe("???");
	});

	it("renders provided codeName in branding and copyright notice", () => {
		const codeName = "Stardust";
		const document = renderFooter({ codeName });
		const heading = document.querySelector("footer h3");
		expect(heading?.textContent).toBe(codeName);

		const currentYear = new Date().getFullYear();
		const copyright = Array.from(document.querySelectorAll("footer p")).find(
			(paragraph) => paragraph.textContent?.includes("All rights reserved."),
		);
		expect(copyright).toBeTruthy();
		if (!copyright) {
			return;
		}
		expect(copyright.textContent).toContain(
			`© ${currentYear} ${codeName}. All rights reserved.`,
		);
	});

	it("renders quick links with expected routes", () => {
		const document = renderFooter();
		const links = Array.from(document.querySelectorAll("footer nav a")).map(
			(link) => ({
				name: link.textContent?.trim(),
				href: link.getAttribute("href"),
			}),
		);

		expect(links).toEqual([
			{ name: "ホーム", href: "/" },
			{ name: "お問い合わせ", href: "/contact" },
		]);
	});

	it("renders social links that open externally with descriptive labels", () => {
		const document = renderFooter();
		const socialLinks = Array.from(
			document.querySelectorAll("footer a[aria-label]"),
		);

		const assertions = socialLinks.map((link) => [
			link.getAttribute("aria-label"),
			link.getAttribute("href"),
			link.getAttribute("target"),
			link.getAttribute("rel"),
		]);

		expect(assertions).toContainEqual([
			"GitHub",
			"https://github.com/seahal/umaxica-app-edge",
			"_blank",
			"noopener noreferrer",
		]);
		expect(assertions).toContainEqual([
			"Twitter",
			"https://twitter.com",
			"_blank",
			"noopener noreferrer",
		]);
	});

	it("includes privacy and terms legal links", () => {
		const document = renderFooter();
		const privacy = document.querySelector('footer a[href="/privacy"]');
		const terms = document.querySelector('footer a[href="/terms"]');

		expect(privacy?.textContent).toBe("プライバシーポリシー");
		expect(terms?.textContent).toBe("利用規約");
	});
});
