import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import {
	SettingItem,
	SettingLayout,
	SettingSection,
} from "../../src/components/SettingComponents";

await import("../../test-setup.ts");

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
		expect(screen.getByRole("heading", { name: "セクション" })).toBeInTheDocument();
		expect(screen.getByText("セクション説明")).toBeInTheDocument();
		expect(screen.getByText("通知")).toBeInTheDocument();
		expect(screen.getByText("通知の設定")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "切り替え" })).toBeInTheDocument();
	});
});
