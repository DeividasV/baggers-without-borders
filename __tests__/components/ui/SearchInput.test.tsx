import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import SearchInput from "@/app/components/ui/SearchInput";

describe("SearchInput Component", () => {
  describe("Rendering", () => {
    it("should render search input", () => {
      render(<SearchInput />);
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should render with placeholder", () => {
      render(<SearchInput placeholder="Search..." />);
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("should render search icon", () => {
      const { container } = render(<SearchInput />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("lucide-search");
    });

    it("should position icon on the left", () => {
      const { container } = render(<SearchInput />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("absolute");
      expect(svg).toHaveClass("left-3");
    });
  });

  describe("User Interactions", () => {
    it("should handle onChange event", () => {
      const handleChange = jest.fn();
      render(<SearchInput onChange={handleChange} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "test query" } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it("should update value on input", () => {
      render(<SearchInput />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "search term" } });
      expect(input.value).toBe("search term");
    });

    it("should handle onFocus event", () => {
      const handleFocus = jest.fn();
      render(<SearchInput onFocus={handleFocus} />);
      const input = screen.getByRole("textbox");
      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it("should handle onBlur event", () => {
      const handleBlur = jest.fn();
      render(<SearchInput onBlur={handleBlur} />);
      const input = screen.getByRole("textbox");
      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it("should handle onKeyDown event", () => {
      const handleKeyDown = jest.fn();
      render(<SearchInput onKeyDown={handleKeyDown} />);
      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Enter" });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe("Attributes", () => {
    it("should have text type", () => {
      render(<SearchInput />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "text");
    });

    it("should accept name attribute", () => {
      render(<SearchInput name="search" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("name", "search");
    });

    it("should accept id attribute", () => {
      render(<SearchInput id="search-input" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("id", "search-input");
    });

    it("should accept value attribute", () => {
      render(<SearchInput value="initial value" onChange={() => {}} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("initial value");
    });

    it("should accept disabled attribute", () => {
      render(<SearchInput disabled />);
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("should accept required attribute", () => {
      render(<SearchInput required />);
      const input = screen.getByRole("textbox");
      expect(input).toBeRequired();
    });

    it("should accept autoFocus attribute", () => {
      render(<SearchInput autoFocus />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveFocus();
    });

    it("should accept maxLength attribute", () => {
      render(<SearchInput maxLength={50} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("maxLength", "50");
    });
  });

  describe("Styling", () => {
    it("should have input-field class", () => {
      render(<SearchInput />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("input-field");
    });

    it("should have left padding for icon", () => {
      render(<SearchInput />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("pl-10");
    });

    it("should have full width", () => {
      render(<SearchInput />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("w-full");
    });

    it("should accept custom className", () => {
      render(<SearchInput className="custom-class" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("custom-class");
    });

    it("should merge className with default classes", () => {
      render(<SearchInput className="extra-class" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("input-field");
      expect(input).toHaveClass("pl-10");
      expect(input).toHaveClass("extra-class");
    });

    it("should style icon appropriately", () => {
      const { container } = render(<SearchInput />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("h-5");
      expect(svg).toHaveClass("w-5");
      expect(svg).toHaveClass("text-gray-400");
    });
  });

  describe("Controlled Component", () => {
    it("should work as controlled input", () => {
      const { rerender } = render(
        <SearchInput value="initial" onChange={() => {}} />
      );
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("initial");

      rerender(<SearchInput value="updated" onChange={() => {}} />);
      expect(input.value).toBe("updated");
    });

    it("should call onChange with event", () => {
      const handleChange = jest.fn();
      render(<SearchInput value="" onChange={handleChange} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "new value" } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty value", () => {
      render(<SearchInput value="" onChange={() => {}} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("should handle long search query", () => {
      const longQuery = "a".repeat(200);
      render(<SearchInput value={longQuery} onChange={() => {}} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe(longQuery);
    });

    it("should handle special characters", () => {
      render(<SearchInput value="test@#$%^&*()" onChange={() => {}} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("test@#$%^&*()");
    });

    it("should handle unicode characters", () => {
      render(<SearchInput value="测试 тест" onChange={() => {}} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("测试 тест");
    });

    it("should handle multiple spaces", () => {
      render(
        <SearchInput value="word    with    spaces" onChange={() => {}} />
      );
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("word    with    spaces");
    });
  });

  describe("Accessibility", () => {
    it("should have textbox role", () => {
      render(<SearchInput />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should be keyboard accessible", () => {
      render(<SearchInput />);
      const input = screen.getByRole("textbox");
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it("should support aria-label", () => {
      render(<SearchInput aria-label="Search products" />);
      expect(screen.getByLabelText("Search products")).toBeInTheDocument();
    });

    it("should support aria-describedby", () => {
      render(<SearchInput aria-describedby="search-help" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-describedby", "search-help");
    });
  });
});
