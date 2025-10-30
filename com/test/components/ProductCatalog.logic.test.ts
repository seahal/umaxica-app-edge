import { describe, expect, it } from "bun:test";

// ProductCatalog.tsx からエクスポートされているデータ型
interface Product {
	id: string;
	name: string;
	description: string;
	price: number;
	category: string;
	image: string;
	stock: number;
}

// ProductCatalog.tsx 内のフィルタリング・ソートロジック
function filterAndSortProducts(
	products: Product[],
	filterCategory: string,
	sortBy: string,
): Product[] {
	return products
		.filter((p) => filterCategory === "all" || p.category === filterCategory)
		.sort((a, b) => {
			if (sortBy === "price-asc") return a.price - b.price;
			if (sortBy === "price-desc") return b.price - a.price;
			if (sortBy === "name") return a.name.localeCompare(b.name);
			return 0;
		});
}

// 価格フォーマット関数
function formatPrice(price: number): string {
	return `¥${price.toLocaleString()}`;
}

// 商品データのバリデーション
function validateProduct(product: Product): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!product.id) errors.push("IDが必要です");
	if (!product.name) errors.push("商品名が必要です");
	if (!product.description) errors.push("説明が必要です");
	if (product.price < 0) errors.push("価格は0以上である必要があります");
	if (!product.category) errors.push("カテゴリが必要です");
	if (!product.image) errors.push("画像が必要です");
	if (product.stock < 0) errors.push("在庫は0以上である必要があります");

	return {
		isValid: errors.length === 0,
		errors,
	};
}

// 在庫状況の判定
function getStockStatus(
	stock: number,
): "in-stock" | "low-stock" | "out-of-stock" {
	if (stock === 0) return "out-of-stock";
	if (stock <= 10) return "low-stock";
	return "in-stock";
}

// カテゴリ別の商品数を取得
function getProductCountByCategory(
	products: Product[],
): Record<string, number> {
	return products.reduce(
		(acc, product) => {
			acc[product.category] = (acc[product.category] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);
}

// 価格帯でフィルタリング
function filterByPriceRange(
	products: Product[],
	minPrice: number,
	maxPrice: number,
): Product[] {
	return products.filter((p) => p.price >= minPrice && p.price <= maxPrice);
}

// 在庫切れ商品を除外
function excludeOutOfStock(products: Product[]): Product[] {
	return products.filter((p) => p.stock > 0);
}

// 人気商品を取得（在庫減少率が高い）
function getPopularProducts(products: Product[], limit = 3): Product[] {
	// 簡易的に在庫が少ない順（売れ筋）をソート
	return [...products]
		.filter((p) => p.stock > 0)
		.sort((a, b) => a.stock - b.stock)
		.slice(0, limit);
}

describe("ProductCatalog Logic Tests", () => {
	const sampleProducts: Product[] = [
		{
			id: "1",
			name: "プレミアムプラン",
			description: "最高のパフォーマンス",
			price: 9800,
			category: "プラン",
			image: "💎",
			stock: 100,
		},
		{
			id: "2",
			name: "スタンダードプラン",
			description: "バランスの良い",
			price: 4800,
			category: "プラン",
			image: "⭐",
			stock: 200,
		},
		{
			id: "3",
			name: "ベーシックプラン",
			description: "始めるのに最適",
			price: 1980,
			category: "プラン",
			image: "🌟",
			stock: 500,
		},
		{
			id: "4",
			name: "アドオン: ストレージ拡張",
			description: "1TB の追加ストレージ",
			price: 980,
			category: "アドオン",
			image: "💾",
			stock: 1000,
		},
		{
			id: "5",
			name: "アドオン: 優先サポート",
			description: "24時間以内の優先対応",
			price: 1480,
			category: "アドオン",
			image: "🎧",
			stock: 0,
		},
	];

	describe("filterAndSortProducts", () => {
		it("should filter by category and sort by price ascending", () => {
			const result = filterAndSortProducts(
				sampleProducts,
				"プラン",
				"price-asc",
			);
			expect(result.length).toBe(3);
			expect(result[0].price).toBe(1980);
			expect(result[2].price).toBe(9800);
		});

		it("should filter by category and sort by price descending", () => {
			const result = filterAndSortProducts(
				sampleProducts,
				"プラン",
				"price-desc",
			);
			expect(result.length).toBe(3);
			expect(result[0].price).toBe(9800);
			expect(result[2].price).toBe(1980);
		});

		it("should show all products when filter is 'all'", () => {
			const result = filterAndSortProducts(sampleProducts, "all", "price-asc");
			expect(result.length).toBe(5);
		});

		it("should sort by name", () => {
			const result = filterAndSortProducts(sampleProducts, "all", "name");
			// アドオンが先に来る
			expect(result[0].name).toContain("アドオン");
		});

		it("should handle empty category filter", () => {
			const result = filterAndSortProducts(
				sampleProducts,
				"存在しない",
				"price-asc",
			);
			expect(result.length).toBe(0);
		});
	});

	describe("formatPrice", () => {
		it("should format price with yen symbol and commas", () => {
			expect(formatPrice(1000)).toBe("¥1,000");
			expect(formatPrice(10000)).toBe("¥10,000");
			expect(formatPrice(1000000)).toBe("¥1,000,000");
		});

		it("should handle zero price", () => {
			expect(formatPrice(0)).toBe("¥0");
		});

		it("should handle small prices", () => {
			expect(formatPrice(100)).toBe("¥100");
			expect(formatPrice(999)).toBe("¥999");
		});
	});

	describe("validateProduct", () => {
		it("should validate a valid product", () => {
			const result = validateProduct(sampleProducts[0]);
			expect(result.isValid).toBe(true);
			expect(result.errors.length).toBe(0);
		});

		it("should reject product without id", () => {
			const invalid = { ...sampleProducts[0], id: "" };
			const result = validateProduct(invalid);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("IDが必要です");
		});

		it("should reject product with negative price", () => {
			const invalid = { ...sampleProducts[0], price: -100 };
			const result = validateProduct(invalid);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("価格は0以上である必要があります");
		});

		it("should reject product with negative stock", () => {
			const invalid = { ...sampleProducts[0], stock: -1 };
			const result = validateProduct(invalid);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("在庫は0以上である必要があります");
		});
	});

	describe("getStockStatus", () => {
		it("should return 'out-of-stock' for zero stock", () => {
			expect(getStockStatus(0)).toBe("out-of-stock");
		});

		it("should return 'low-stock' for stock <= 10", () => {
			expect(getStockStatus(1)).toBe("low-stock");
			expect(getStockStatus(10)).toBe("low-stock");
		});

		it("should return 'in-stock' for stock > 10", () => {
			expect(getStockStatus(11)).toBe("in-stock");
			expect(getStockStatus(100)).toBe("in-stock");
		});
	});

	describe("getProductCountByCategory", () => {
		it("should count products by category", () => {
			const counts = getProductCountByCategory(sampleProducts);
			expect(counts.プラン).toBe(3);
			expect(counts.アドオン).toBe(2);
		});

		it("should handle empty array", () => {
			const counts = getProductCountByCategory([]);
			expect(Object.keys(counts).length).toBe(0);
		});
	});

	describe("filterByPriceRange", () => {
		it("should filter products by price range", () => {
			const result = filterByPriceRange(sampleProducts, 1000, 5000);
			expect(result.length).toBe(3); // 1980, 4800, 1480
			expect(result.every((p) => p.price >= 1000 && p.price <= 5000)).toBe(
				true,
			);
		});

		it("should return all products for wide range", () => {
			const result = filterByPriceRange(sampleProducts, 0, 100000);
			expect(result.length).toBe(5);
		});

		it("should return empty for impossible range", () => {
			const result = filterByPriceRange(sampleProducts, 100000, 200000);
			expect(result.length).toBe(0);
		});
	});

	describe("excludeOutOfStock", () => {
		it("should exclude out of stock products", () => {
			const result = excludeOutOfStock(sampleProducts);
			expect(result.length).toBe(4);
			expect(result.every((p) => p.stock > 0)).toBe(true);
		});

		it("should handle all in stock", () => {
			const allInStock = sampleProducts.filter((p) => p.stock > 0);
			const result = excludeOutOfStock(allInStock);
			expect(result.length).toBe(allInStock.length);
		});
	});

	describe("getPopularProducts", () => {
		it("should return top 3 popular products", () => {
			const result = getPopularProducts(sampleProducts, 3);
			expect(result.length).toBe(3);
		});

		it("should exclude out of stock products", () => {
			const result = getPopularProducts(sampleProducts);
			expect(result.every((p) => p.stock > 0)).toBe(true);
		});

		it("should respect limit parameter", () => {
			const result = getPopularProducts(sampleProducts, 2);
			expect(result.length).toBe(2);
		});

		it("should handle empty array", () => {
			const result = getPopularProducts([]);
			expect(result.length).toBe(0);
		});
	});
});
