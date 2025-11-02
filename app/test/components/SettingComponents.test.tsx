import "../../test-setup.ts";

import { describe, expect, it } from "bun:test";

const { render, screen } = await import("@testing-library/react");

import {
	SettingItem,
	SettingLayout,
	SettingSection,
} from "../../src/components/SettingComponents";

describe("SettingComponents", () => {
	it("renders layout with header and sections", () => {
		render(
			<SettingLayout title="設定" description="説明">
				<SettingSection title="セクション" description="セクション説明">
					<SettingItem label="通知" description="通知の設定">
						<button type="button">切り替え</button>
					</SettingItem>
				</SettingSection>
			</SettingLayout>,
		);

		expect(screen.getByRole("heading", { name: "設定" })).toBeInTheDocument();
		expect(screen.getByText("説明")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "セクション" }),
		).toBeInTheDocument();
		expect(screen.getByText("セクション説明")).toBeInTheDocument();
		expect(screen.getByText("通知")).toBeInTheDocument();
		expect(screen.getByText("通知の設定")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "切り替え" }),
		).toBeInTheDocument();
	});

	it("renders SettingLayout without description", () => {
		render(
			<SettingLayout title="設定">
				<div>Content</div>
			</SettingLayout>,
		);

		expect(screen.getByRole("heading", { name: "設定" })).toBeInTheDocument();
		expect(screen.getByText("Content")).toBeInTheDocument();
	});

	it("renders SettingSection without description", () => {
		render(
			<SettingSection title="セクション">
				<div>Content</div>
			</SettingSection>,
		);

		expect(screen.getByRole("heading", { name: "セクション" })).toBeInTheDocument();
		expect(screen.getByText("Content")).toBeInTheDocument();
	});

	it("renders SettingItem without description", () => {
		render(
			<SettingItem label="通知">
				<button type="button">Toggle</button>
			</SettingItem>,
		);

		expect(screen.getByText("通知")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Toggle" })).toBeInTheDocument();
	});

	it("renders multiple SettingSections", () => {
		render(
			<SettingLayout title="設定">
				<SettingSection title="プライバシー">
					<div>Privacy content</div>
				</SettingSection>
				<SettingSection title="通知">
					<div>Notification content</div>
				</SettingSection>
			</SettingLayout>,
		);

		expect(screen.getByRole("heading", { name: "プライバシー" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "通知" })).toBeInTheDocument();
		expect(screen.getByText("Privacy content")).toBeInTheDocument();
		expect(screen.getByText("Notification content")).toBeInTheDocument();
	});

	it("renders multiple SettingItems in a section", () => {
		render(
			<SettingSection title="通知設定">
				<SettingItem label="メール通知">
					<button type="button">Toggle 1</button>
				</SettingItem>
				<SettingItem label="プッシュ通知">
					<button type="button">Toggle 2</button>
				</SettingItem>
			</SettingSection>,
		);

		expect(screen.getByText("メール通知")).toBeInTheDocument();
		expect(screen.getByText("プッシュ通知")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Toggle 1" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Toggle 2" })).toBeInTheDocument();
	});

	it("renders SettingItem with long description", () => {
		const longDescription = "This is a very long description that explains the setting in detail. It should wrap properly and display correctly.";

		render(
			<SettingItem label="詳細設定" description={longDescription}>
				<input type="checkbox" />
			</SettingItem>,
		);

		expect(screen.getByText("詳細設定")).toBeInTheDocument();
		expect(screen.getByText(longDescription)).toBeInTheDocument();
	});

	it("renders nested structure with all components", () => {
		render(
			<SettingLayout title="アカウント設定" description="アカウントに関する設定を管理します">
				<SettingSection title="基本設定" description="基本的な設定項目">
					<SettingItem label="ユーザー名" description="表示名を変更できます">
						<input type="text" defaultValue="user123" />
					</SettingItem>
					<SettingItem label="メールアドレス" description="連絡先メールアドレス">
						<input type="email" defaultValue="user@example.com" />
					</SettingItem>
				</SettingSection>
				<SettingSection title="セキュリティ" description="セキュリティに関する設定">
					<SettingItem label="二段階認証" description="アカウントの安全性を高めます">
						<button type="button">有効化</button>
					</SettingItem>
				</SettingSection>
			</SettingLayout>,
		);

		// Layout
		expect(screen.getByRole("heading", { name: "アカウント設定" })).toBeInTheDocument();
		expect(screen.getByText("アカウントに関する設定を管理します")).toBeInTheDocument();

		// First section
		expect(screen.getByRole("heading", { name: "基本設定" })).toBeInTheDocument();
		expect(screen.getByText("基本的な設定項目")).toBeInTheDocument();
		expect(screen.getByText("ユーザー名")).toBeInTheDocument();
		expect(screen.getByText("メールアドレス")).toBeInTheDocument();

		// Second section
		expect(screen.getByRole("heading", { name: "セキュリティ" })).toBeInTheDocument();
		expect(screen.getByText("セキュリティに関する設定")).toBeInTheDocument();
		expect(screen.getByText("二段階認証")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "有効化" })).toBeInTheDocument();
	});
});
