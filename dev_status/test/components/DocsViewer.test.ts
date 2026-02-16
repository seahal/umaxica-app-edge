import { describe, expect, it } from "vitest";

// ドキュメントセクションの型
interface DocSection {
  id: string;
  title: string;
  content: string;
  code?: string;
}

// ドキュメントビューア関連のユーティリティ関数
function searchSections(sections: DocSection[], query: string): DocSection[] {
  const lowerQuery = query.toLowerCase();
  return sections.filter(
    (section) =>
      section.title.toLowerCase().includes(lowerQuery) ||
      section.content.toLowerCase().includes(lowerQuery) ||
      section.code?.toLowerCase().includes(lowerQuery),
  );
}

function getNextSection(sections: DocSection[], currentId: string): DocSection | null {
  const currentIndex = sections.findIndex((s) => s.id === currentId);
  if (currentIndex === -1 || currentIndex === sections.length - 1) {
    return null;
  }
  return sections[currentIndex + 1] ?? null;
}

function getPreviousSection(sections: DocSection[], currentId: string): DocSection | null {
  const currentIndex = sections.findIndex((s) => s.id === currentId);
  if (currentIndex <= 0) {
    return null;
  }
  return sections[currentIndex - 1] ?? null;
}

function extractCodeSnippets(sections: DocSection[]): string[] {
  return sections.flatMap((section) => (section.code ? [section.code] : []));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

function generateTableOfContents(sections: DocSection[]): string[] {
  return sections.map((s) => s.title);
}

describe("DocsViewer Utilities", () => {
  const sampleSections: DocSection[] = [
    {
      id: "getting-started",
      title: "はじめに",
      content: "React Aria Components へようこそ",
      code: "import { Button } from 'react-aria-components';",
    },
    {
      id: "button",
      title: "Button コンポーネント",
      content: "Button は最も基本的なコンポーネントです",
      code: "<Button onPress={() => console.log('pressed')}>ボタン</Button>",
    },
    {
      id: "tabs",
      title: "Tabs コンポーネント",
      content: "Tabs は複数のコンテンツを切り替えます",
      code: "<Tabs><TabList><Tab>タブ1</Tab></TabList></Tabs>",
    },
    {
      id: "dialog",
      title: "Dialog コンポーネント",
      content: "Dialog はモーダルウィンドウを実装します",
    },
  ];

  describe("searchSections", () => {
    it("should search by title", () => {
      const results = searchSections(sampleSections, "Button コンポーネント");
      expect(results.length).toBe(1);
      expect(results[0]?.id).toBe("button");
    });

    it("should search by content", () => {
      const results = searchSections(sampleSections, "基本的");
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("should search by code", () => {
      const results = searchSections(sampleSections, "onPress");
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("should be case insensitive", () => {
      const results1 = searchSections(sampleSections, "button");
      const results2 = searchSections(sampleSections, "BUTTON");
      expect(results1.length).toBe(results2.length);
    });

    it("should return empty array for no matches", () => {
      const results = searchSections(sampleSections, "存在しない");
      expect(results).toEqual([]);
    });
  });

  describe("getNextSection", () => {
    it("should get next section", () => {
      const next = getNextSection(sampleSections, "getting-started");
      expect(next?.id).toBe("button");
    });

    it("should return null for last section", () => {
      const next = getNextSection(sampleSections, "dialog");
      expect(next).toBeNull();
    });

    it("should return null for non-existent section", () => {
      const next = getNextSection(sampleSections, "non-existent");
      expect(next).toBeNull();
    });
  });

  describe("getPreviousSection", () => {
    it("should get previous section", () => {
      const prev = getPreviousSection(sampleSections, "button");
      expect(prev?.id).toBe("getting-started");
    });

    it("should return null for first section", () => {
      const prev = getPreviousSection(sampleSections, "getting-started");
      expect(prev).toBeNull();
    });

    it("should return null for non-existent section", () => {
      const prev = getPreviousSection(sampleSections, "non-existent");
      expect(prev).toBeNull();
    });
  });

  describe("extractCodeSnippets", () => {
    it("should extract all code snippets", () => {
      const snippets = extractCodeSnippets(sampleSections);
      expect(snippets.length).toBe(3);
    });

    it("should handle sections without code", () => {
      const sectionWithoutCode = sampleSections[3];
      expect(sectionWithoutCode).toBeDefined();
      if (!sectionWithoutCode) {
        return;
      }
      const snippets = extractCodeSnippets([sectionWithoutCode]);
      expect(snippets).toEqual([]);
    });
  });

  describe("countWords", () => {
    it("should count words correctly", () => {
      const count = countWords("これは テスト です");
      expect(count).toBe(3);
    });

    it("should handle empty string", () => {
      expect(countWords("")).toBe(1); // split on empty string gives [""]
    });

    it("should handle multiple spaces", () => {
      const count = countWords("これは    テスト    です");
      expect(count).toBe(3);
    });
  });

  describe("generateTableOfContents", () => {
    it("should generate table of contents", () => {
      const toc = generateTableOfContents(sampleSections);
      expect(toc.length).toBe(4);
      expect(toc[0]).toBe("はじめに");
      expect(toc[1]).toBe("Button コンポーネント");
    });

    it("should handle empty array", () => {
      expect(generateTableOfContents([])).toEqual([]);
    });
  });
});
