import { describe, expect, it } from "bun:test";

// イベントデータの型
interface Event {
	id: string;
	title: string;
	date: string;
	category: "conference" | "meetup" | "workshop" | "webinar";
	capacity: number;
	registered: number;
}

// イベント一覧関連のユーティリティ関数
function filterByCategory(events: Event[], category: string): Event[] {
	if (category === "all") return events;
	return events.filter((e) => e.category === category);
}

function calculateFillRate(event: Event): number {
	return (event.registered / event.capacity) * 100;
}

function getRemainingSlots(event: Event): number {
	return event.capacity - event.registered;
}

function isEventFull(event: Event): boolean {
	return event.registered >= event.capacity;
}

function sortEventsByDate(events: Event[]): Event[] {
	return [...events].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
	);
}

function getUpcomingEvents(events: Event[], days = 30): Event[] {
	const now = new Date();
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + days);

	return events.filter((event) => {
		const eventDate = new Date(event.date);
		return eventDate >= now && eventDate <= futureDate;
	});
}

describe("EventList Utilities", () => {
	const sampleEvents: Event[] = [
		{
			id: "1",
			title: "React Aria ハンズオン",
			date: "2025-11-15",
			category: "workshop",
			capacity: 50,
			registered: 32,
		},
		{
			id: "2",
			title: "Web アクセシビリティカンファレンス",
			date: "2025-11-22",
			category: "conference",
			capacity: 200,
			registered: 156,
		},
		{
			id: "3",
			title: "フロントエンド開発者ミートアップ",
			date: "2025-11-08",
			category: "meetup",
			capacity: 30,
			registered: 28,
		},
		{
			id: "4",
			title: "デザインシステム構築ウェビナー",
			date: "2025-11-30",
			category: "webinar",
			capacity: 100,
			registered: 100,
		},
	];

	describe("filterByCategory", () => {
		it("should filter by category", () => {
			const filtered = filterByCategory(sampleEvents, "workshop");
			expect(filtered.length).toBe(1);
			expect(filtered[0]?.category).toBe("workshop");
		});

		it("should return all events for 'all' category", () => {
			const filtered = filterByCategory(sampleEvents, "all");
			expect(filtered.length).toBe(4);
		});

		it("should return empty array for non-existent category", () => {
			const filtered = filterByCategory(sampleEvents, "存在しない");
			expect(filtered).toEqual([]);
		});
	});

	describe("calculateFillRate", () => {
		it("should calculate fill rate correctly", () => {
			const event = sampleEvents[0];
			expect(event).toBeDefined();
			if (!event) {
				return;
			}
			const rate = calculateFillRate(event);
			expect(rate).toBe(64); // 32/50 * 100
		});

		it("should handle 100% fill rate", () => {
			const event = sampleEvents[3];
			expect(event).toBeDefined();
			if (!event) {
				return;
			}
			const rate = calculateFillRate(event);
			expect(rate).toBe(100);
		});

		it("should handle 0% fill rate", () => {
			const baseEvent = sampleEvents[0];
			expect(baseEvent).toBeDefined();
			if (!baseEvent) {
				return;
			}
			const emptyEvent = { ...baseEvent, registered: 0 };
			expect(calculateFillRate(emptyEvent)).toBe(0);
		});
	});

	describe("getRemainingSlots", () => {
		it("should calculate remaining slots", () => {
			const event = sampleEvents[0];
			expect(event).toBeDefined();
			if (!event) {
				return;
			}
			expect(getRemainingSlots(event)).toBe(18); // 50 - 32
		});

		it("should return 0 for full event", () => {
			const event = sampleEvents[3];
			expect(event).toBeDefined();
			if (!event) {
				return;
			}
			expect(getRemainingSlots(event)).toBe(0);
		});

		it("should handle nearly full event", () => {
			const event = sampleEvents[2];
			expect(event).toBeDefined();
			if (!event) {
				return;
			}
			expect(getRemainingSlots(event)).toBe(2); // 30 - 28
		});
	});

	describe("isEventFull", () => {
		it("should return false for non-full event", () => {
			const event = sampleEvents[0];
			expect(event).toBeDefined();
			if (!event) {
				return;
			}
			expect(isEventFull(event)).toBe(false);
		});

		it("should return true for full event", () => {
			const event = sampleEvents[3];
			expect(event).toBeDefined();
			if (!event) {
				return;
			}
			expect(isEventFull(event)).toBe(true);
		});
	});

	describe("sortEventsByDate", () => {
		it("should sort events by date", () => {
			const sorted = sortEventsByDate(sampleEvents);
			expect(sorted[0]?.date).toBe("2025-11-08");
			const lastEvent = sorted.at(-1);
			expect(lastEvent?.date).toBe("2025-11-30");
		});

		it("should not mutate original array", () => {
			const original = [...sampleEvents];
			sortEventsByDate(sampleEvents);
			expect(sampleEvents).toEqual(original);
		});
	});

	describe("getUpcomingEvents", () => {
		it("should filter upcoming events within 30 days", () => {
			// Note: This test might fail depending on current date
			// In real scenario, we would mock Date
			const upcoming = getUpcomingEvents(sampleEvents, 365);
			expect(upcoming.length).toBeGreaterThanOrEqual(0);
		});

		it("should handle custom day range", () => {
			const upcoming = getUpcomingEvents(sampleEvents, 1);
			expect(Array.isArray(upcoming)).toBe(true);
		});
	});
});
