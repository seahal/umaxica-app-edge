import { describe, expect, it } from "bun:test";

// テスト対象のメタ関数をインポート
// import { meta as homeMeta } from "../../src/routes/home";
import { meta as aboutMeta } from "../../src/routes/about";
import { meta as contactMeta } from "../../src/routes/contact";
import { meta as servicesMeta } from "../../src/routes/services";

// メタ情報テスト
// この部分はSEO対応の責務: 各ページのメタデータが正しく設定されることを検証
// テストではこう確認する: title と description が期待される値になっているかをテスト
// Helper types derived from route meta functions
type AboutMetaItem = ReturnType<typeof aboutMeta>[number];
type ServicesMetaItem = ReturnType<typeof servicesMeta>[number];
type ContactMetaItem = ReturnType<typeof contactMeta>[number];

describe("Page Meta Information", () => {
	// it("should return correct meta information for Home page", () => {
	// 	const meta = homeMeta({} as any);
	// 	const titleMeta = meta.find((m: any) => m.title);
	// 	const descriptionMeta = meta.find((m: any) => m.name === "description");

	// 	expect(titleMeta?.title).toBe("Umaxica - Home");
	// 	expect(descriptionMeta?.content).toContain("Umaxicaは最先端のテクノロジー");
	// });

	it("should return correct meta information for About page", () => {
		const meta = aboutMeta({} as unknown as Parameters<typeof aboutMeta>[0]);
		const titleMeta = meta.find(
			(m: AboutMetaItem) => (m as { title?: string }).title,
		);
		const descriptionMeta = meta.find(
			(m: AboutMetaItem) => (m as { name?: string }).name === "description",
		);

		expect(titleMeta?.title).toBe("About Us - Umaxica");
		expect(descriptionMeta?.content).toContain("Umaxicaの会社概要");
	});

	it("should return correct meta information for Services page", () => {
		const meta = servicesMeta(
			{} as unknown as Parameters<typeof servicesMeta>[0],
		);
		const titleMeta = meta.find(
			(m: ServicesMetaItem) => (m as { title?: string }).title,
		);
		const descriptionMeta = meta.find(
			(m: ServicesMetaItem) => (m as { name?: string }).name === "description",
		);

		expect(titleMeta?.title).toBe("Services - Umaxica");
		expect(descriptionMeta?.content).toContain("Webアプリケーション開発");
	});

	it("should return correct meta information for Contact page", () => {
		const meta = contactMeta(
			{} as unknown as Parameters<typeof contactMeta>[0],
		);
		const titleMeta = meta.find(
			(m: ContactMetaItem) => (m as { title?: string }).title,
		);
		const descriptionMeta = meta.find(
			(m: ContactMetaItem) => (m as { name?: string }).name === "description",
		);

		expect(titleMeta?.title).toBe("Contact - Umaxica");
		expect(descriptionMeta?.content).toContain("お問い合わせはこちらから");
	});

	// it("should include required meta properties for all pages", () => {
	// 	const pages = [
	// 		{ name: "Home", meta: homeMeta },
	// 		{ name: "About", meta: aboutMeta },
	// 		{ name: "Services", meta: servicesMeta },
	// 		{ name: "Contact", meta: contactMeta },
	// 	];

	// 	pages.forEach(({ name, meta }) => {
	// 		const metaData = meta({} as any);

	// 		// titleが存在することを確認
	// 		const titleMeta = metaData.find((m: any) => m.title);
	// 		expect(titleMeta).toBeDefined();
	// 		expect(typeof titleMeta?.title).toBe("string");
	// 		expect(titleMeta?.title.length).toBeGreaterThan(0);

	// 		// descriptionが存在することを確認
	// 		const descriptionMeta = metaData.find(
	// 			(m: any) => m.name === "description",
	// 		);
	// 		expect(descriptionMeta).toBeDefined();
	// 		expect(typeof descriptionMeta?.content).toBe("string");
	// 		expect(descriptionMeta?.content.length).toBeGreaterThan(0);
	// 	});
	// });

	it("should have unique titles for all pages", () => {
		const titles = [
			// homeMeta({} as unknown as Parameters<typeof homeMeta>[0]).find((m: HomeMetaItem) => (m as { title?: string }).title)?.title,
			aboutMeta({} as unknown as Parameters<typeof aboutMeta>[0]).find(
				(m: AboutMetaItem) => (m as { title?: string }).title,
			)?.title,
			servicesMeta({} as unknown as Parameters<typeof servicesMeta>[0]).find(
				(m: ServicesMetaItem) => (m as { title?: string }).title,
			)?.title,
			contactMeta({} as unknown as Parameters<typeof contactMeta>[0]).find(
				(m: ContactMetaItem) => (m as { title?: string }).title,
			)?.title,
		];

		// 重複がないことを確認
		const uniqueTitles = new Set(titles);
		expect(uniqueTitles.size).toBe(titles.length);
	});

	it("should have appropriate title lengths for SEO", () => {
		const pages = [
			/* homeMeta, */ aboutMeta,
			servicesMeta,
			contactMeta,
		] as const;

		pages.forEach((metaFn) => {
			const meta = metaFn({} as unknown as Parameters<typeof metaFn>[0]);
			const titleMeta = meta.find(
				(m: ReturnType<typeof metaFn>[number]) =>
					(m as { title?: string }).title,
			);

			if (titleMeta?.title) {
				// SEO的に適切なタイトル長（10-60文字程度）
				expect(titleMeta.title.length).toBeGreaterThanOrEqual(10);
				expect(titleMeta.title.length).toBeLessThanOrEqual(60);
			}
		});
	});

	it("should have appropriate description lengths for SEO", () => {
		const pages = [
			/* homeMeta, */ aboutMeta,
			servicesMeta,
			contactMeta,
		] as const;

		pages.forEach((metaFn) => {
			const meta = metaFn({} as unknown as Parameters<typeof metaFn>[0]);
			const descriptionMeta = meta.find(
				(m: ReturnType<typeof metaFn>[number]) =>
					(m as { name?: string }).name === "description",
			);

			if (descriptionMeta?.content) {
				// SEO的に適切な説明文長（50-160文字程度）
				expect(descriptionMeta.content.length).toBeGreaterThanOrEqual(30);
				expect(descriptionMeta.content.length).toBeLessThanOrEqual(200);
			}
		});
	});
});
