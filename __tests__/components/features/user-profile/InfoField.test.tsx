import React from "react";
import { render, screen } from "@testing-library/react";
import InfoField from "@/app/components/features/user-profile/InfoField";

describe("InfoField Component", () => {
  describe("Basic Rendering", () => {
    it("should render label", () => {
      render(<InfoField label="Email" value="test@example.com" />);
      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("should render value", () => {
      render(<InfoField label="Name" value="John Doe" />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should render label and value together", () => {
      render(<InfoField label="Phone" value="+1234567890" />);
      expect(screen.getByText("Phone")).toBeInTheDocument();
      expect(screen.getByText("+1234567890")).toBeInTheDocument();
    });
  });

  describe("Empty Value Handling", () => {
    it('should show "Not set" when value is undefined', () => {
      render(<InfoField label="Address" />);
      expect(screen.getByText("Not set")).toBeInTheDocument();
    });

    it('should show "Not set" when value is empty string', () => {
      render(<InfoField label="City" value="" />);
      expect(screen.getByText("Not set")).toBeInTheDocument();
    });

    it('should apply italic styling to "Not set"', () => {
      render(<InfoField label="Country" />);
      const notSetSpan = screen.getByText("Not set");
      expect(notSetSpan).toHaveClass("italic");
    });

    it('should apply gray color to "Not set"', () => {
      render(<InfoField label="Region" />);
      const notSetSpan = screen.getByText("Not set");
      expect(notSetSpan).toHaveClass("text-gray-500");
    });
  });

  describe("Link Rendering", () => {
    it("should render as link when isLink is true", () => {
      render(
        <InfoField label="Website" value="https://example.com" isLink={true} />
      );
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://example.com");
    });

    it("should open link in new tab", () => {
      render(
        <InfoField label="Website" value="https://example.com" isLink={true} />
      );
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("should have noopener noreferrer for security", () => {
      render(
        <InfoField label="Website" value="https://example.com" isLink={true} />
      );
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should apply primary color to link", () => {
      render(
        <InfoField label="Website" value="https://example.com" isLink={true} />
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-primary-400");
    });

    it("should have underline on link", () => {
      render(
        <InfoField label="Website" value="https://example.com" isLink={true} />
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("underline");
    });

    it("should handle long URLs with break-all", () => {
      render(
        <InfoField
          label="URL"
          value="https://verylongurl.com/path/to/resource"
          isLink={true}
        />
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("break-all");
    });

    it("should not render link when isLink is false", () => {
      render(
        <InfoField label="Text" value="https://example.com" isLink={false} />
      );
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("should render as text when isLink is true but value is empty", () => {
      render(<InfoField label="Website" value="" isLink={true} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.getByText("Not set")).toBeInTheDocument();
    });

    it("should render as text when isLink is true but value is undefined", () => {
      render(<InfoField label="Website" isLink={true} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.getByText("Not set")).toBeInTheDocument();
    });
  });

  describe("Text Rendering", () => {
    it("should render plain text when isLink is false", () => {
      render(<InfoField label="Description" value="Some description" />);
      expect(screen.getByText("Some description")).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("should render plain text by default", () => {
      render(<InfoField label="Notes" value="Some notes" />);
      expect(screen.getByText("Some notes")).toBeInTheDocument();
    });

    it("should apply gray text color to plain text", () => {
      render(<InfoField label="Info" value="Text" />);
      const span = screen.getByText("Text");
      expect(span).toHaveClass("text-gray-100");
    });
  });

  describe("Styling", () => {
    it("should apply spacing between label and value", () => {
      const { container } = render(<InfoField label="Test" value="Value" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("space-y-1");
    });

    it("should style label as medium font", () => {
      render(<InfoField label="Label" value="Value" />);
      const label = screen.getByText("Label");
      expect(label).toHaveClass("font-medium");
    });

    it("should style label with gray color", () => {
      render(<InfoField label="Field" value="Value" />);
      const label = screen.getByText("Field");
      expect(label).toHaveClass("text-gray-400");
    });

    it("should style label with small text", () => {
      render(<InfoField label="Title" value="Value" />);
      const label = screen.getByText("Title");
      expect(label).toHaveClass("text-sm");
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in value", () => {
      render(<InfoField label="Special" value="!@#$%^&*()" />);
      expect(screen.getByText("!@#$%^&*()")).toBeInTheDocument();
    });

    it("should handle numbers in value", () => {
      render(<InfoField label="Age" value="25" />);
      expect(screen.getByText("25")).toBeInTheDocument();
    });

    it("should handle multiline text in value", () => {
      const multiline = "Line 1\nLine 2\nLine 3";
      const { container } = render(
        <InfoField label="Address" value={multiline} />
      );
      const span = container.querySelector("span.text-gray-100");
      expect(span).toHaveTextContent(/Line 1.*Line 2.*Line 3/);
    });

    it("should handle very long text", () => {
      const longText = "a".repeat(500);
      render(<InfoField label="Long" value={longText} />);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("should handle Unicode characters", () => {
      render(<InfoField label="Unicode" value="日本語 français 中文" />);
      expect(screen.getByText("日本語 français 中文")).toBeInTheDocument();
    });

    it("should handle emojis", () => {
      render(<InfoField label="Emoji" value="🏔️ 🎿 🧗" />);
      expect(screen.getByText("🏔️ 🎿 🧗")).toBeInTheDocument();
    });

    it("should handle whitespace-only value as text", () => {
      const { container } = render(<InfoField label="Empty" value="   " />);
      const span = container.querySelector("span.text-gray-100");
      expect(span).toBeInTheDocument();
      expect(span?.textContent).toContain("   ");
    });
  });

  describe("Accessibility", () => {
    it("should use label element for accessibility", () => {
      const { container } = render(
        <InfoField label="Email" value="test@test.com" />
      );
      const label = container.querySelector("label");
      expect(label).toBeInTheDocument();
    });

    it("should render link with proper accessibility attributes", () => {
      render(
        <InfoField label="Link" value="https://example.com" isLink={true} />
      );
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });
  });
});
