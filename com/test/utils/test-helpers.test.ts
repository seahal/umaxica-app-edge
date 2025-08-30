import { describe, expect, it } from "bun:test";
import {
	containsJapanese,
	createMockCloudflareContext,
	getDescription,
	getMetaProperty,
	getTitle,
	isValidSEOLength,
	validateContactForm,
	validateServiceData,
	validateStatsData,
} from "../../src/utils/test-helpers";

// テストヘルパー関数のテスト
// この部分はユーティリティ関数テストの責務: ヘルパー関数の正確な動作を検証
describe("Test Helpers", () => {
	describe("getMetaProperty", () => {
		const mockMeta = [
			{ title: "Test Title" },
			{ name: "description", content: "Test Description" },
			{ property: "og:title", content: "OG Title" },
		];

		it("should get title property correctly", () => {
			const title = getMetaProperty(mockMeta, "title");
			expect(title).toBe("Test Title");
		});

		it("should get description content correctly", () => {
			const description = getMetaProperty(mockMeta, "content", "name");
			expect(description).toBe("Test Description");
		});

		it("should return undefined for non-existent property", () => {
			const result = getMetaProperty(mockMeta, "nonexistent");
			expect(result).toBeUndefined();
		});
	});

	describe("getTitle and getDescription", () => {
		const mockMeta = [
			{ title: "Page Title" },
			{ name: "description", content: "Page Description" },
		];

		it("should extract title correctly", () => {
			const title = getTitle(mockMeta);
			expect(title).toBe("Page Title");
		});

		it("should extract description correctly", () => {
			const description = getDescription(mockMeta);
			expect(description).toBe("Page Description");
		});

		it("should return undefined when title is missing", () => {
			const metaWithoutTitle = [
				{ name: "description", content: "Description" },
			];
			const title = getTitle(metaWithoutTitle);
			expect(title).toBeUndefined();
		});
	});

	describe("isValidSEOLength", () => {
		it("should validate title length correctly", () => {
			expect(isValidSEOLength("Short Title", "title")).toBe(true);
			expect(isValidSEOLength("Short", "title")).toBe(false); // 10文字未満
			expect(isValidSEOLength("A".repeat(70), "title")).toBe(false); // 60文字超過
		});

		it("should validate description length correctly", () => {
			const validDescription =
				"これは適切な長さの説明文です。SEOに最適化されています。内容は十分な長さを持っています。";
			expect(isValidSEOLength(validDescription, "description")).toBe(true);

			const shortDescription = "短すぎる";
			expect(isValidSEOLength(shortDescription, "description")).toBe(false);

			const longDescription = "A".repeat(250);
			expect(isValidSEOLength(longDescription, "description")).toBe(false);
		});
	});

	describe("containsJapanese", () => {
		it("should detect Japanese characters correctly", () => {
			expect(containsJapanese("こんにちは")).toBe(true); // ひらがな
			expect(containsJapanese("カタカナ")).toBe(true); // カタカナ
			expect(containsJapanese("漢字")).toBe(true); // 漢字
			expect(containsJapanese("Hello World")).toBe(false); // 英語のみ
			expect(containsJapanese("Hello こんにちは")).toBe(true); // 混在
		});

		it("should handle empty and special characters", () => {
			expect(containsJapanese("")).toBe(false);
			expect(containsJapanese("123!@#")).toBe(false);
		});
	});

	describe("createMockCloudflareContext", () => {
		it("should create basic mock context", () => {
			const context = createMockCloudflareContext();

			expect(context).toHaveProperty("cloudflare");
			expect(context.cloudflare).toHaveProperty("env");
			expect(context.cloudflare).toHaveProperty("cf");
			expect(context.cloudflare).toHaveProperty("ctx");
			expect(context.cloudflare.env.VALUE_FROM_CLOUDFLARE).toBe(
				"Test Environment Message",
			);
		});

		it("should apply overrides correctly", () => {
			const overrides = { CUSTOM_VALUE: "Custom Test" };
			const context = createMockCloudflareContext(overrides);

			expect(context.cloudflare.env.CUSTOM_VALUE).toBe("Custom Test");
			expect(context.cloudflare.env.VALUE_FROM_CLOUDFLARE).toBe(
				"Test Environment Message",
			);
		});

		it("should override default values", () => {
			const overrides = { VALUE_FROM_CLOUDFLARE: "Override Message" };
			const context = createMockCloudflareContext(overrides);

			expect(context.cloudflare.env.VALUE_FROM_CLOUDFLARE).toBe(
				"Override Message",
			);
		});
	});

	describe("validateServiceData", () => {
		const validService = {
			id: "test-service",
			title: "Test Service",
			category: "テスト",
			description: "サービスの説明",
			features: ["機能1", "機能2"],
			technologies: ["Tech1", "Tech2"],
			price: "¥100,000〜",
			duration: "1-2ヶ月",
			icon: "🔧",
		};

		it("should validate complete service data", () => {
			expect(validateServiceData(validService)).toBe(true);
		});

		it("should reject service with missing required fields", () => {
			const incompleteService = { ...validService };
			delete incompleteService.title;

			expect(validateServiceData(incompleteService)).toBe(false);
		});

		it("should reject service with empty arrays", () => {
			const serviceWithEmptyFeatures = { ...validService, features: [] };
			expect(validateServiceData(serviceWithEmptyFeatures)).toBe(false);
		});

		it("should reject service with empty strings", () => {
			const serviceWithEmptyTitle = { ...validService, title: "" };
			expect(validateServiceData(serviceWithEmptyTitle)).toBe(false);
		});
	});

	describe("validateContactForm", () => {
		const validFormData = {
			name: "山田太郎",
			email: "yamada@example.com",
			message: "お問い合わせ内容です",
			company: "株式会社テスト",
		};

		it("should validate complete form data", () => {
			const result = validateContactForm(validFormData);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should reject form with missing required fields", () => {
			const incompleteFormData = { ...validFormData, name: "" };
			const result = validateContactForm(incompleteFormData);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("お名前は必須です");
		});

		it("should reject invalid email format", () => {
			const invalidEmailFormData = { ...validFormData, email: "invalid-email" };
			const result = validateContactForm(invalidEmailFormData);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("有効なメールアドレスを入力してください");
		});

		it("should allow optional company field", () => {
			const formDataWithoutCompany = { ...validFormData };
			delete formDataWithoutCompany.company;

			const result = validateContactForm(formDataWithoutCompany);
			expect(result.isValid).toBe(true);
		});

		it("should handle multiple validation errors", () => {
			const invalidFormData = {
				name: "",
				email: "invalid",
				message: "",
			};
			const result = validateContactForm(invalidFormData);

			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(1);
		});
	});

	describe("validateStatsData", () => {
		const validStats = {
			projectsCompleted: 500,
			clientsSatisfied: 150,
			yearsOfExperience: 10,
		};

		it("should validate complete stats data", () => {
			expect(validateStatsData(validStats)).toBe(true);
		});

		it("should reject non-object stats", () => {
			expect(validateStatsData("not an object")).toBe(false);
			expect(validateStatsData(null)).toBe(false);
			expect(validateStatsData(undefined)).toBe(false);
		});

		it("should reject stats with missing properties", () => {
			const incompleteStats = { ...validStats };
			delete incompleteStats.projectsCompleted;

			expect(validateStatsData(incompleteStats)).toBe(false);
		});

		it("should reject stats with non-number values", () => {
			const invalidStats = { ...validStats, projectsCompleted: "500" };
			expect(validateStatsData(invalidStats)).toBe(false);
		});

		it("should reject stats with zero or negative values", () => {
			const zeroStats = { ...validStats, projectsCompleted: 0 };
			const negativeStats = { ...validStats, yearsOfExperience: -1 };

			expect(validateStatsData(zeroStats)).toBe(false);
			expect(validateStatsData(negativeStats)).toBe(false);
		});
	});

	describe("Integration Tests", () => {
		it("should work together for SEO validation workflow", () => {
			const mockMeta = [
				{ title: "Umaxica - 革新的なソリューションを提供" },
				{
					name: "description",
					content:
						"私たちは最先端技術でお客様のビジネス課題を解決します。高品質なサービスを提供しています。",
				},
			];

			const title = getTitle(mockMeta);
			const description = getDescription(mockMeta);

			expect(title).toBeDefined();
			expect(description).toBeDefined();
			if (!title || !description) {
				throw new Error("Title or description is undefined");
			}
			expect(isValidSEOLength(title, "title")).toBe(true);
			expect(isValidSEOLength(description, "description")).toBe(true);
			expect(containsJapanese(title)).toBe(true);
			expect(containsJapanese(description)).toBe(true);
		});

		it("should handle end-to-end service validation", () => {
			const mockService = {
				id: "web-development",
				title: "Webアプリケーション開発",
				category: "開発",
				description: "React、Next.jsを使用したモダンなWebアプリケーション開発",
				features: ["レスポンシブデザイン", "SEO最適化"],
				technologies: ["React", "TypeScript"],
				price: "¥500,000〜",
				duration: "2-4ヶ月",
				icon: "🚀",
			};

			expect(validateServiceData(mockService)).toBe(true);
			expect(containsJapanese(mockService.title)).toBe(true);
			expect(containsJapanese(mockService.description)).toBe(true);
		});
	});
});
