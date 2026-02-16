import "../../test-setup.ts";

import { describe, expect, it } from "bun:test";

const { render, screen } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;

import { AuthForm, SocialLoginButton } from "../../src/components/AuthForm";

describe("AuthForm component", () => {
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

describe("SocialLoginButton component", () => {
  it("renders Google login button with correct text and icon", () => {
    render(<SocialLoginButton provider="google" />);

    expect(screen.getByRole("button", { name: /Googleでログイン/ })).toBeInTheDocument();
    expect(screen.getByTitle("Google")).toBeInTheDocument();
  });

  it("renders Twitter login button with correct text and icon", () => {
    render(<SocialLoginButton provider="twitter" />);

    expect(screen.getByRole("button", { name: /Twitterでログイン/ })).toBeInTheDocument();
    expect(screen.getByTitle("Twitter")).toBeInTheDocument();
  });

  it("renders GitHub login button with correct text and icon", () => {
    render(<SocialLoginButton provider="github" />);

    expect(screen.getByRole("button", { name: /GitHubでログイン/ })).toBeInTheDocument();
    expect(screen.getByTitle("GitHub")).toBeInTheDocument();
  });

  it("calls onClick handler when Google button is clicked", async () => {
    const user = userEvent.setup();
    const clicks: string[] = [];

    render(<SocialLoginButton provider="google" onClick={() => clicks.push("google")} />);

    await user.click(screen.getByRole("button", { name: /Googleでログイン/ }));
    expect(clicks).toEqual(["google"]);
  });

  it("calls onClick handler when Twitter button is clicked", async () => {
    const user = userEvent.setup();
    const clicks: string[] = [];

    render(<SocialLoginButton provider="twitter" onClick={() => clicks.push("twitter")} />);

    await user.click(screen.getByRole("button", { name: /Twitterでログイン/ }));
    expect(clicks).toEqual(["twitter"]);
  });

  it("calls onClick handler when GitHub button is clicked", async () => {
    const user = userEvent.setup();
    const clicks: string[] = [];

    render(<SocialLoginButton provider="github" onClick={() => clicks.push("github")} />);

    await user.click(screen.getByRole("button", { name: /GitHubでログイン/ }));
    expect(clicks).toEqual(["github"]);
  });

  it("works without onClick handler", async () => {
    const user = userEvent.setup();

    render(<SocialLoginButton provider="google" />);

    // Should not throw when clicking without onClick handler
    await user.click(screen.getByRole("button", { name: /Googleでログイン/ }));
  });
});
