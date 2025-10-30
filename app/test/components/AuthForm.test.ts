import { describe, expect, it } from "bun:test";

// 認証関連のユーティリティ関数
function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

function validatePassword(password: string): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (password.length < 8) {
		errors.push("8文字以上必要です");
	}
	if (!/[A-Z]/.test(password)) {
		errors.push("大文字を含む必要があります");
	}
	if (!/[a-z]/.test(password)) {
		errors.push("小文字を含む必要があります");
	}
	if (!/[0-9]/.test(password)) {
		errors.push("数字を含む必要があります");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

function checkPasswordStrength(password: string): "weak" | "medium" | "strong" {
	const result = validatePassword(password);

	if (!result.isValid) return "weak";
	if (password.length >= 12 && /[!@#$%^&*]/.test(password)) return "strong";
	return "medium";
}

function sanitizeInput(input: string): string {
	return input
		.trim()
		.replace(/<script>/gi, "")
		.replace(/<\/script>/gi, "");
}

function generatePasswordHash(password: string): string {
	// 実際にはbcryptなどを使用しますが、テスト用に簡易実装
	return `hashed_${password}`;
}

describe("AuthForm Utilities", () => {
	describe("validateEmail", () => {
		it("should validate correct email", () => {
			expect(validateEmail("user@example.com")).toBe(true);
			expect(validateEmail("test.user@umaxica.app")).toBe(true);
		});

		it("should reject invalid email", () => {
			expect(validateEmail("invalid")).toBe(false);
			expect(validateEmail("@example.com")).toBe(false);
			expect(validateEmail("user@")).toBe(false);
			expect(validateEmail("user@.com")).toBe(false);
		});

		it("should handle empty string", () => {
			expect(validateEmail("")).toBe(false);
		});
	});

	describe("validatePassword", () => {
		it("should validate strong password", () => {
			const result = validatePassword("Password123");
			expect(result.isValid).toBe(true);
			expect(result.errors.length).toBe(0);
		});

		it("should reject short password", () => {
			const result = validatePassword("Pass1");
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("8文字以上必要です");
		});

		it("should require uppercase", () => {
			const result = validatePassword("password123");
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("大文字を含む必要があります");
		});

		it("should require lowercase", () => {
			const result = validatePassword("PASSWORD123");
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("小文字を含む必要があります");
		});

		it("should require number", () => {
			const result = validatePassword("Password");
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("数字を含む必要があります");
		});
	});

	describe("checkPasswordStrength", () => {
		it("should return weak for invalid password", () => {
			expect(checkPasswordStrength("pass")).toBe("weak");
		});

		it("should return medium for valid password", () => {
			expect(checkPasswordStrength("Password123")).toBe("medium");
		});

		it("should return strong for complex password", () => {
			expect(checkPasswordStrength("Password123!@#")).toBe("strong");
		});
	});

	describe("sanitizeInput", () => {
		it("should trim whitespace", () => {
			expect(sanitizeInput("  test  ")).toBe("test");
		});

		it("should remove script tags", () => {
			expect(sanitizeInput("<script>alert('xss')</script>")).toBe(
				"alert('xss')",
			);
		});

		it("should handle normal input", () => {
			expect(sanitizeInput("normal text")).toBe("normal text");
		});
	});

	describe("generatePasswordHash", () => {
		it("should generate hash", () => {
			const hash = generatePasswordHash("password");
			expect(hash).toBe("hashed_password");
		});

		it("should generate different hashes for different passwords", () => {
			const hash1 = generatePasswordHash("password1");
			const hash2 = generatePasswordHash("password2");
			expect(hash1).not.toBe(hash2);
		});
	});
});
