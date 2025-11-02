import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthForm } from "../../src/components/AuthForm";

await import("../../test-setup.ts");

describe("AuthForm component", () => {
	it("submits login credentials when form is valid", async () => {
		const user = userEvent.setup();
		const handlers = { submit: (_data: Record<string, string>) => {} };
		const handleSubmit = mock.method(handlers, "submit");

		render(<AuthForm type="login" onSubmit={handlers.submit} />);

		await user.type(screen.getByLabelText("メールアドレス"), "user@example.com");
		await user.type(screen.getByLabelText("パスワード"), "Passw0rd!");

		await user.click(screen.getByRole("button", { name: "ログイン" }));

		expect(handleSubmit).toHaveBeenCalledWith({
			email: "user@example.com",
			password: "Passw0rd!",
		});
		expect(
			screen.getByRole("link", { name: "パスワードをお忘れですか？" }),
		).toBeInTheDocument();
	});

	it("requires terms agreement for signup before enabling submit", async () => {
		const user = userEvent.setup();
		const handlers = { submit: (_data: Record<string, string>) => {} };
		const handleSubmit = mock.method(handlers, "submit");

		render(<AuthForm type="signup" onSubmit={handlers.submit} />);

		const submitButton = screen.getByRole("button", { name: "アカウントを作成" });
		expect(submitButton).toBeDisabled();

		await user.type(screen.getByLabelText("名前"), "テスト 太郎");
		await user.type(screen.getByLabelText("メールアドレス"), "new@example.com");
		await user.type(screen.getByLabelText("パスワード"), "Passw0rd!");

		await user.click(
			screen.getByRole("checkbox", {
				name: /利用規約.*プライバシーポリシー/,
			}),
		);
		expect(submitButton).toBeEnabled();

		await user.click(submitButton);
		expect(handleSubmit).toHaveBeenCalledWith({
			email: "new@example.com",
			password: "Passw0rd!",
			name: "テスト 太郎",
		});
	});

	it("toggles password visibility", async () => {
		const user = userEvent.setup();

		render(<AuthForm type="login" />);

		const password = screen.getByLabelText("パスワード") as HTMLInputElement;
		expect(password.type).toBe("password");

		await user.click(screen.getByRole("button", { name: "表示" }));
		expect(password.type).toBe("text");

		await user.click(screen.getByRole("button", { name: "非表示" }));
		expect(password.type).toBe("password");
	});
});
