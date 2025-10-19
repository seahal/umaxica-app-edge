import { describe, expect, it } from "bun:test";

import { Children } from "react";
import type { ReactElement } from "react";

import {
	Links as LinksComponent,
	Meta as MetaComponent,
	Scripts as ScriptsComponent,
	ScrollRestoration as ScrollRestorationComponent,
} from "react-router";

import { Layout, meta } from "../src/root";

describe("root layout shell", () => {
	it("provides an empty title by default", () => {
		expect(meta({} as never)).toEqual([{ title: "" }]);
	});

	it("wraps children with the expected HTML skeleton", () => {
		const content = <section data-testid="content">ok</section>;
		const element = Layout({ children: content });

		expect(element.type).toBe("html");

		const [head, body] = Children.toArray(
			element.props.children,
		) as ReactElement[];
		expect(head.type).toBe("head");
		const headChildren = Children.toArray(
			head.props.children,
		) as ReactElement[];
		expect(headChildren.some((node) => node.type === MetaComponent)).toBe(true);
		expect(headChildren.some((node) => node.type === LinksComponent)).toBe(
			true,
		);

		expect(body.type).toBe("body");
		const bodyChildren = Children.toArray(
			body.props.children,
		) as ReactElement[];
		const firstChild = bodyChildren[0] as ReactElement;
		expect(firstChild.type).toBe("section");
		expect(firstChild.props["data-testid"]).toBe("content");
		expect(
			bodyChildren.some((node) => node.type === ScrollRestorationComponent),
		).toBe(true);
		expect(bodyChildren.some((node) => node.type === ScriptsComponent)).toBe(
			true,
		);
	});
});
