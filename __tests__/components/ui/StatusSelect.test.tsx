import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StatusSelect from "@/app/components/ui/StatusSelect";

describe("StatusSelect Component", () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render input field", () => {
      render(<StatusSelect {...defaultProps} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<StatusSelect {...defaultProps} label="User Status" />);
      expect(screen.getByText("User Status")).toBeInTheDocument();
    });

    it("should render required indicator", () => {
      render(<StatusSelect {...defaultProps} label="Status" required={true} />);
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render placeholder", () => {
      render(<StatusSelect {...defaultProps} placeholder="Choose status" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.placeholder).toBe("Choose status");
    });

    it("should render error message", () => {
      render(<StatusSelect {...defaultProps} error="Status is required" />);
      expect(screen.getByText("Status is required")).toBeInTheDocument();
    });

    it("should render chevron icon", () => {
      const { container } = render(<StatusSelect {...defaultProps} />);
      expect(
        container.querySelector(".lucide-chevron-down")
      ).toBeInTheDocument();
    });
  });

  describe("Dropdown Toggle", () => {
    it("should not show dropdown initially", () => {
      render(<StatusSelect {...defaultProps} />);
      expect(screen.queryByText("Active")).not.toBeInTheDocument();
    });

    it("should open dropdown when input focused", () => {
      render(<StatusSelect {...defaultProps} />);
      fireEvent.focus(screen.getByRole("textbox"));
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should open dropdown when chevron clicked", () => {
      const { container } = render(<StatusSelect {...defaultProps} />);
      const chevronButton = container.querySelector(".lucide-chevron-down")
        ?.parentElement as HTMLButtonElement;
      fireEvent.click(chevronButton);
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should close dropdown when clicking outside", async () => {
      render(<StatusSelect {...defaultProps} />);
      fireEvent.focus(screen.getByRole("textbox"));
      expect(screen.getByText("Active")).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText("Active")).not.toBeInTheDocument();
      });
    });

    it("should rotate chevron when open", () => {
      const { container } = render(<StatusSelect {...defaultProps} />);
      fireEvent.focus(screen.getByRole("textbox"));

      const chevron = container.querySelector(".lucide-chevron-down");
      expect(chevron).toHaveClass("rotate-180");
    });
  });

  describe("Status Options", () => {
    it("should display all status options", () => {
      render(<StatusSelect {...defaultProps} />);
      fireEvent.focus(screen.getByRole("textbox"));

      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("New")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Inactive")).toBeInTheDocument();
      expect(screen.getByText("Archived")).toBeInTheDocument();
    });

    it("should call onChange when status selected", () => {
      render(<StatusSelect {...defaultProps} />);
      fireEvent.focus(screen.getByRole("textbox"));

      fireEvent.click(screen.getByText("Active"));
      expect(mockOnChange).toHaveBeenCalledWith("ACTIVE");
    });

    it("should close dropdown after selection", async () => {
      render(<StatusSelect {...defaultProps} />);
      fireEvent.focus(screen.getByRole("textbox"));

      fireEvent.click(screen.getByText("Active"));

      await waitFor(() => {
        expect(screen.queryByText("Inactive")).not.toBeInTheDocument();
      });
    });

    it("should display selected status", () => {
      render(<StatusSelect {...defaultProps} value="ACTIVE" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("Active");
    });

    it("should highlight selected status in dropdown", () => {
      render(<StatusSelect {...defaultProps} value="ACTIVE" />);
      fireEvent.focus(screen.getByRole("textbox"));

      const activeButton = screen.getAllByText("Active")[0].closest("button");
      expect(activeButton).toHaveClass("bg-primary-900/40");
    });

    it("should show checkmark for selected status", () => {
      render(<StatusSelect {...defaultProps} value="ACTIVE" />);
      fireEvent.focus(screen.getByRole("textbox"));

      const activeButton = screen.getAllByText("Active")[0].closest("button");
      expect(activeButton?.textContent).toContain("✓");
    });
  });

  describe("Search Functionality", () => {
    it("should filter statuses when typing", () => {
      render(<StatusSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "act" } });

      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Inactive")).toBeInTheDocument();
      expect(screen.queryByText("New")).not.toBeInTheDocument();
    });

    it("should show no results message when no match", () => {
      render(<StatusSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "xyz" } });

      expect(screen.getByText("No statuses found")).toBeInTheDocument();
    });

    it("should clear search when option selected", async () => {
      render(<StatusSelect {...defaultProps} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "act" } });
      fireEvent.click(screen.getByText("Active"));

      // After selection, dropdown closes and value is set
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith("ACTIVE");
      });
    });

    it("should be case insensitive", () => {
      render(<StatusSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "ACT" } });

      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should close dropdown on Escape", () => {
      render(<StatusSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.focus(input);
      expect(screen.getByText("Active")).toBeInTheDocument();

      fireEvent.keyDown(input, { key: "Escape" });
      expect(screen.queryByText("Active")).not.toBeInTheDocument();
    });

    it("should select first filtered option on Enter", () => {
      render(<StatusSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "new" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockOnChange).toHaveBeenCalledWith("NEW");
    });

    it("should open dropdown on ArrowDown when closed", () => {
      render(<StatusSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should not select when Enter pressed with no results", () => {
      render(<StatusSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "xyz" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Clear Functionality", () => {
    it("should show clear button when value selected", () => {
      const { container } = render(
        <StatusSelect {...defaultProps} value="ACTIVE" />
      );
      expect(container.querySelector(".lucide-x")).toBeInTheDocument();
    });

    it("should not show clear button when no value", () => {
      const { container } = render(<StatusSelect {...defaultProps} />);
      expect(container.querySelector(".lucide-x")).not.toBeInTheDocument();
    });

    it("should call onChange with empty string when cleared", () => {
      const { container } = render(
        <StatusSelect {...defaultProps} value="ACTIVE" />
      );
      const clearButton = container.querySelector(".lucide-x")
        ?.parentElement as HTMLButtonElement;

      fireEvent.click(clearButton);
      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("should clear search term when cleared", () => {
      const { container } = render(
        <StatusSelect {...defaultProps} value="ACTIVE" />
      );
      const clearButton = container.querySelector(".lucide-x")
        ?.parentElement as HTMLButtonElement;

      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith("");
    });
  });

  describe("Input Behavior", () => {
    it("should be readonly when dropdown closed", () => {
      render(<StatusSelect {...defaultProps} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.readOnly).toBe(true);
    });

    it("should be editable when dropdown open", () => {
      render(<StatusSelect {...defaultProps} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      fireEvent.focus(input);
      expect(input.readOnly).toBe(false);
    });

    it("should have cursor pointer style", () => {
      render(<StatusSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("cursor-pointer");
    });
  });

  describe("Error State", () => {
    it("should apply error border", () => {
      render(<StatusSelect {...defaultProps} error="Required" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-red-500");
    });

    it("should show error message", () => {
      render(<StatusSelect {...defaultProps} error="This field is required" />);
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("should apply error text color", () => {
      render(<StatusSelect {...defaultProps} error="Error" />);
      const errorText = screen.getByText("Error");
      expect(errorText).toHaveClass("text-red-400");
    });
  });

  describe("Value Sync", () => {
    it("should update display when value prop changes", () => {
      const { rerender } = render(
        <StatusSelect {...defaultProps} value="NEW" />
      );
      let input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("New");

      rerender(<StatusSelect {...defaultProps} value="ACTIVE" />);
      input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("Active");
    });

    it("should show All when value is empty", () => {
      render(<StatusSelect {...defaultProps} value="" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("All");
    });

    it("should handle undefined value", () => {
      render(<StatusSelect {...defaultProps} value={undefined} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid toggle", () => {
      const { container } = render(<StatusSelect {...defaultProps} />);
      const chevronButton = container.querySelector(".lucide-chevron-down")
        ?.parentElement as HTMLButtonElement;

      fireEvent.click(chevronButton);
      fireEvent.click(chevronButton);
      fireEvent.click(chevronButton);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should handle search and clear", () => {
      render(<StatusSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "act" } });
      expect(screen.getByText("Active")).toBeInTheDocument();

      fireEvent.change(input, { target: { value: "" } });
      expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("should handle all props together", () => {
      render(
        <StatusSelect
          {...defaultProps}
          label="Account Status"
          value="ACTIVE"
          placeholder="Choose"
          required={true}
          error="Required"
        />
      );

      expect(screen.getByText("Account Status")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("Active");
      expect(screen.getByText("Required")).toBeInTheDocument();
    });
  });
});
