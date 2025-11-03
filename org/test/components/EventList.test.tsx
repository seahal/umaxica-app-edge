import "../../test-setup.ts";

import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

const { EventList } = await import("../../src/components/EventList");

function getRenderedEventTitles() {
	return screen
		.getAllByRole("heading", { level: 3 })
		.map((heading) => heading.textContent?.trim());
}

describe("EventList component (org)", () => {
	it("renders all events by default", () => {
		render(<EventList />);

		expect(getRenderedEventTitles()).toEqual([
			"React Aria ハンズオンワークショップ",
			"Web アクセシビリティカンファレンス 2025",
			"フロントエンド開発者ミートアップ",
			"デザインシステム構築ウェビナー",
		]);
	});

	it("exposes category filters for each event type", () => {
		render(<EventList />);

		const filters = [
			"すべて",
			"カンファレンス",
			"ミートアップ",
			"ワークショップ",
			"ウェビナー",
		];

		for (const name of filters) {
			expect(screen.getAllByRole("radio", { name })).not.toHaveLength(0);
		}
	});
});
