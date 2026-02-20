import type { Child, FC, Props } from "hono/jsx";

declare global {
  namespace JSX {
    type Element = ReturnType<FC<Props>>;
    interface IntrinsicElements {
      [elemName: string]: Props;
    }
    interface ElementChildrenAttribute {
      children?: Child;
    }
  }
}

declare module "hono/jsx" {
  interface HtmlEscapedString {
    toString(): string;
  }
}
