import "../../test-setup.ts";

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Authentication from "../../src/routes/authentication/_index";

describe("Authentication route", () => {
  it("renders login and signup tabs", () => {
    render(<Authentication loaderData={{ message: "test" }} params={{}} matches={[]} />);

    expect(screen.getByRole("tab", { name: "ログイン" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "新規登録" })).toBeInTheDocument();
  });

  it("switches between login and signup tabs", async () => {
    const user = userEvent.setup();
    render(<Authentication loaderData={{ message: "test" }} params={{}} matches={[]} />);

    const signupTab = screen.getByRole("tab", { name: "新規登録" });
    await user.click(signupTab);

    expect(signupTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "アカウントを作成" })).toBeInTheDocument();

    const loginTab = screen.getByRole("tab", { name: "ログイン" });
    await user.click(loginTab);

    expect(loginTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "ログイン" })).toBeInTheDocument();
  });

  it("handles social login clicks", async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, "log");
    // Mock alert since it's used in the component
    vi.stubGlobal("alert", vi.fn());

    render(<Authentication loaderData={{ message: "test" }} params={{}} matches={[]} />);

    const googleButtons = screen.getAllByRole("button", { name: /Google/ });
    await user.click(googleButtons[0]!);

    expect(consoleSpy).toHaveBeenCalledWith("Googleでログイン");
    expect(window.alert).toHaveBeenCalled();
  });

  it("handles form submission", async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, "log");
    vi.stubGlobal("alert", vi.fn());

    render(<Authentication loaderData={{ message: "test" }} params={{}} matches={[]} />);

    const emailInput = screen.getByLabelText(/メールアドレス/);
    const passwordInput = screen.getByLabelText(/パスワード/);
    const submitButton = screen.getByRole("button", { name: "ログイン" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    expect(consoleSpy).toHaveBeenCalledWith(
      "認証データ:",
      expect.objectContaining({
        email: "test@example.com",
        password: "password123",
      }),
    );
  });
});
