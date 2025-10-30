import { describe, expect, it } from "bun:test";

// 商品データの型
interface Product {
	id: string;
	name: string;
	price: number;
	category: string;
	stock: number;
}

// 商品カタログ関連のユーティリティ関数
function sortProducts(
	products: Product[],
	sortBy: "price-asc" | "price-desc" | "name",
): Product[] {
	return [...products].sort((a, b) => {
		if (sortBy === "price-asc") return a.price - b.price;
		if (sortBy === "price-desc") return b.price - a.price;
		if (sortBy === "name") return a.name.localeCompare(b.name);
		return 0;
	});
}

function filterByCategory(products: Product[], category: string): Product[] {
	if (category === "all") return products;
	return products.filter((p) => p.category === category);
}

function calculateTotalPrice(products: Product[]): number {
	return products.reduce((sum, p) => sum + p.price, 0);
}

function isInStock(product: Product): boolean {
	return product.stock > 0;
}

function getDiscountedPrice(price: number, discount: number): number {
	return Math.floor(price * (1 - discount / 100));
}

describe("ProductCatalog Utilities", () => {
	const sampleProducts: Product[] = [
		{
			id: "1",
			name: "プレミアムプラン",
			price: 9800,
			category: "プラン",
			stock: 100,
		},
		{
			id: "2",
			name: "スタンダードプラン",
			price: 4800,
			category: "プラン",
			stock: 200,
		},
		{
			id: "3",
			name: "ベーシックプラン",
			price: 1980,
			category: "プラン",
			stock: 500,
		},
		{
			id: "4",
			name: "アドオン: ストレージ拡張",
			price: 980,
			category: "アドオン",
			stock: 1000,
		},
		{
			id: "5",
			name: "アドオン: 優先サポート",
			price: 1480,
			category: "アドオン",
			stock: 0,
		},
	];

	describe("sortProducts", () => {
		it("should sort by price ascending", () => {
			const sorted = sortProducts(sampleProducts, "price-asc");
			expect(sorted[0].price).toBe(980);
			expect(sorted[sorted.length - 1].price).toBe(9800);
		});

		it("should sort by price descending", () => {
			const sorted = sortProducts(sampleProducts, "price-desc");
			expect(sorted[0].price).toBe(9800);
			expect(sorted[sorted.length - 1].price).toBe(980);
		});

		it("should sort by name", () => {
			const sorted = sortProducts(sampleProducts, "name");
			expect(sorted[0].name).toContain("アドオン");
		});

		it("should not mutate original array", () => {
			const original = [...sampleProducts];
			sortProducts(sampleProducts, "price-asc");
			expect(sampleProducts).toEqual(original);
		});
	});

	describe("filterByCategory", () => {
		it("should filter by category", () => {
			const filtered = filterByCategory(sampleProducts, "プラン");
			expect(filtered.length).toBe(3);
			expect(filtered.every((p) => p.category === "プラン")).toBe(true);
		});

		it("should return all products for 'all' category", () => {
			const filtered = filterByCategory(sampleProducts, "all");
			expect(filtered.length).toBe(5);
		});

		it("should return empty array for non-existent category", () => {
			const filtered = filterByCategory(sampleProducts, "存在しない");
			expect(filtered).toEqual([]);
		});
	});

	describe("calculateTotalPrice", () => {
		it("should calculate total price", () => {
			const total = calculateTotalPrice(sampleProducts);
			expect(total).toBe(19040); // 9800 + 4800 + 1980 + 980 + 1480
		});

		it("should handle empty array", () => {
			expect(calculateTotalPrice([])).toBe(0);
		});

		it("should handle single product", () => {
			const total = calculateTotalPrice([sampleProducts[0]]);
			expect(total).toBe(9800);
		});
	});

	describe("isInStock", () => {
		it("should return true for in-stock product", () => {
			expect(isInStock(sampleProducts[0])).toBe(true);
		});

		it("should return false for out-of-stock product", () => {
			expect(isInStock(sampleProducts[4])).toBe(false);
		});
	});

	describe("getDiscountedPrice", () => {
		it("should calculate 10% discount", () => {
			expect(getDiscountedPrice(1000, 10)).toBe(900);
		});

		it("should calculate 50% discount", () => {
			expect(getDiscountedPrice(1000, 50)).toBe(500);
		});

		it("should handle 0% discount", () => {
			expect(getDiscountedPrice(1000, 0)).toBe(1000);
		});

		it("should handle 100% discount", () => {
			expect(getDiscountedPrice(1000, 100)).toBe(0);
		});
	});
});
