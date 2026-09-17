import React from "react";
import { render, screen } from "@testing-library/react";
import MarkdownViewer from "@/app/components/ui/MarkdownViewer";
import { getMarkdownTableStylePreset } from "@/src/lib/markdown-table-styles";

describe("MarkdownViewer Component", () => {
  describe("Basic Rendering", () => {
    it("should render markdown content", () => {
      render(<MarkdownViewer content="Hello World" />);
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("should render empty content", () => {
      const { container } = render(<MarkdownViewer content="" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should apply default prose classes", () => {
      const { container } = render(<MarkdownViewer content="Test" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("prose", "prose-invert", "prose-sm", "max-w-none");
    });

    it("should render with custom className", () => {
      const { container } = render(<MarkdownViewer content="Test" className="custom-class" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass(
        "prose",
        "prose-invert",
        "prose-sm",
        "max-w-none",
        "custom-class"
      );
    });

    it("should render without custom className", () => {
      const { container } = render(<MarkdownViewer content="Test" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("prose", "prose-invert", "prose-sm", "max-w-none");
    });
  });

  describe("Content Rendering", () => {
    it("should render plain text", () => {
      render(<MarkdownViewer content="This is plain text" />);
      expect(screen.getByText("This is plain text")).toBeInTheDocument();
    });

    it("should render markdown with special characters", () => {
      render(<MarkdownViewer content="Text with **bold** and *italic*" />);
      expect(screen.getByText("Text with **bold** and *italic*")).toBeInTheDocument();
    });

    it("should render multiline content", () => {
      const content = `Line 1
Line 2
Line 3`;
      render(<MarkdownViewer content={content} />);
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });

    it("should render content with links", () => {
      render(<MarkdownViewer content="Check [this link](https://example.com)" />);
      expect(screen.getByText(/Check \[this link\]/)).toBeInTheDocument();
    });

    it("should render content with headings", () => {
      render(<MarkdownViewer content="# Heading 1" />);
      expect(screen.getByText("# Heading 1")).toBeInTheDocument();
    });

    it("should render content with lists", () => {
      const content = `- Item 1
- Item 2
- Item 3`;
      render(<MarkdownViewer content={content} />);
      expect(screen.getByText(/Item 1/)).toBeInTheDocument();
    });

    it("should render content with code blocks", () => {
      render(<MarkdownViewer content="`code here`" />);
      expect(screen.getByText("`code here`")).toBeInTheDocument();
    });

    it("should render content with blockquotes", () => {
      render(<MarkdownViewer content="> This is a quote" />);
      expect(screen.getByText("> This is a quote")).toBeInTheDocument();
    });

    it("should keep the legacy table preset as the default", () => {
      const preset = getMarkdownTableStylePreset(undefined);

      expect(preset.wrapperClassName).toContain("overflow-x-auto");
      expect(preset.tableClassName).toContain("table-fixed");
      expect(preset.headerCellClassName).toContain("wrap-anywhere");
      expect(preset.bodyCellClassName).toContain("wrap-anywhere");
    });

    it("should provide HoF-inspired classes for the standard preset", () => {
      const preset = getMarkdownTableStylePreset("standard");

      expect(preset.wrapperClassName).toContain("not-prose");
      expect(preset.wrapperClassName).toContain("bg-dark-900");
      expect(preset.tableClassName).toContain("border-dark-600");
      expect(preset.tableClassName).toContain("border-dark-700");
      expect(preset.headerCellClassName).toContain("px-4");
      expect(preset.bodyCellClassName).toContain("py-4");
    });

    it("should allow the none preset without the BWB table shell", () => {
      const preset = getMarkdownTableStylePreset("none");

      expect(preset.wrapperClassName).not.toContain("not-prose");
      expect(preset.wrapperClassName).not.toContain("bg-dark-900");
      expect(preset.tableClassName).toContain("text-inherit");
      expect(preset.tableClassName).not.toContain("table-fixed");
    });

    it("should expose striped row styling for the striped preset", () => {
      const preset = getMarkdownTableStylePreset("striped");

      expect(preset.tableClassName).toContain("nth-child(even)");
      expect(preset.tableClassName).toContain("[&_tbody_tr:hover]:bg-dark-700/70");
    });

    it("should expose stacked mobile row styling for responsive cards", () => {
      const preset = getMarkdownTableStylePreset("responsive-cards");

      expect(preset.tableClassName).toContain("[&_thead]:hidden");
      expect(preset.tableClassName).toContain("[&_tbody_tr]:block");
      expect(preset.wrapperClassName).toContain("overflow-x-hidden");
    });
  });

  describe("Edge Cases", () => {
    it("should handle null content gracefully", () => {
      const { container } = render(<MarkdownViewer content={null as any} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle undefined content gracefully", () => {
      const { container } = render(<MarkdownViewer content={undefined as any} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle very long content", () => {
      const longContent = "A".repeat(10000);
      render(<MarkdownViewer content={longContent} />);
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it("should handle content with special HTML characters", () => {
      render(<MarkdownViewer content="<div>HTML content</div>" />);
      expect(screen.getByText("<div>HTML content</div>")).toBeInTheDocument();
    });

    it("should handle content with newlines", () => {
      render(<MarkdownViewer content="Line 1\n\nLine 2" />);
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });

    it("should handle content with tabs", () => {
      render(<MarkdownViewer content="Text\twith\ttabs" />);
      expect(screen.getByText(/Text.*with.*tabs/)).toBeInTheDocument();
    });

    it("should handle content with emojis", () => {
      render(<MarkdownViewer content="Hello 👋 World 🌍" />);
      expect(screen.getByText("Hello 👋 World 🌍")).toBeInTheDocument();
    });

    it("should handle content with unicode characters", () => {
      render(<MarkdownViewer content="Café résumé naïve" />);
      expect(screen.getByText("Café résumé naïve")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply prose typography classes", () => {
      const { container } = render(<MarkdownViewer content="Test" />);
      expect(container.firstChild).toHaveClass("prose");
    });

    it("should apply dark mode prose variant", () => {
      const { container } = render(<MarkdownViewer content="Test" />);
      expect(container.firstChild).toHaveClass("prose-invert");
    });

    it("should apply small prose size", () => {
      const { container } = render(<MarkdownViewer content="Test" />);
      expect(container.firstChild).toHaveClass("prose-sm");
    });

    it("should remove max-width constraint", () => {
      const { container } = render(<MarkdownViewer content="Test" />);
      expect(container.firstChild).toHaveClass("max-w-none");
    });

    it("should combine default and custom classes", () => {
      const { container } = render(<MarkdownViewer content="Test" className="mt-4 p-2" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("prose", "prose-invert", "prose-sm", "max-w-none", "mt-4", "p-2");
    });

    it("should handle multiple custom classes", () => {
      const { container } = render(
        <MarkdownViewer content="Test" className="custom-1 custom-2 custom-3" />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-1", "custom-2", "custom-3");
    });
  });

  describe("Component Structure", () => {
    it("should wrap content in a div", () => {
      const { container } = render(<MarkdownViewer content="Test" />);
      expect(container.firstChild?.nodeName).toBe("DIV");
    });

    it("should render ReactMarkdown component", () => {
      const { container } = render(<MarkdownViewer content="Test" />);
      expect(container.querySelector("div div")).toBeInTheDocument();
    });

    it("should not render additional wrapper elements", () => {
      const { container } = render(<MarkdownViewer content="Test" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBe(1);
    });
  });

  describe("Props Validation", () => {
    it("should accept string content prop", () => {
      expect(() => render(<MarkdownViewer content="String content" />)).not.toThrow();
    });

    it("should accept empty string content", () => {
      expect(() => render(<MarkdownViewer content="" />)).not.toThrow();
    });

    it("should accept optional className prop", () => {
      expect(() => render(<MarkdownViewer content="Test" className="test" />)).not.toThrow();
    });

    it("should work without className prop", () => {
      expect(() => render(<MarkdownViewer content="Test" />)).not.toThrow();
    });

    it("should accept whitespace in content", () => {
      const { container } = render(<MarkdownViewer content="   " />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
