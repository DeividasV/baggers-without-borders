import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RoleSelect from "@/app/components/ui/RoleSelect";

describe("RoleSelect Component", () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render input field", () => {
      render(<RoleSelect {...defaultProps} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<RoleSelect {...defaultProps} label="User Role" />);
      expect(screen.getByText("User Role")).toBeInTheDocument();
    });

    it("should render required indicator", () => {
      render(<RoleSelect {...defaultProps} label="Role" required={true} />);
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render placeholder", () => {
      render(<RoleSelect {...defaultProps} placeholder="Choose role" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.placeholder).toBe("Choose role");
    });

    it("should render default placeholder", () => {
      render(<RoleSelect {...defaultProps} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.placeholder).toBe("Select role");
    });

    it("should render error message", () => {
      render(<RoleSelect {...defaultProps} error="Role is required" />);
      expect(screen.getByText("Role is required")).toBeInTheDocument();
    });

    it("should render chevron icon", () => {
      const { container } = render(<RoleSelect {...defaultProps} />);
      expect(
        container.querySelector(".lucide-chevron-down")
      ).toBeInTheDocument();
    });
  });

  describe("Dropdown Toggle", () => {
    it("should not show dropdown initially", () => {
      render(<RoleSelect {...defaultProps} />);
      expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    });

    it("should open dropdown when input clicked", () => {
      render(<RoleSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));
      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("User")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("should open dropdown when chevron clicked", () => {
      const { container } = render(<RoleSelect {...defaultProps} />);
      const chevronButton = container.querySelector(".lucide-chevron-down")
        ?.parentElement as HTMLButtonElement;
      fireEvent.click(chevronButton);
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("should close dropdown when clicking outside", async () => {
      render(<RoleSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));
      expect(screen.getByText("Admin")).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText("Admin")).not.toBeInTheDocument();
      });
    });

    it("should toggle dropdown on repeated clicks", () => {
      render(<RoleSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.click(input);
      expect(screen.getByText("Admin")).toBeInTheDocument();

      fireEvent.click(input);
      expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    });

    it("should rotate chevron when open", () => {
      const { container } = render(<RoleSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const chevron = container.querySelector(".lucide-chevron-down");
      expect(chevron).toHaveClass("rotate-180");
    });
  });

  describe("Role Selection", () => {
    it("should display all role options", () => {
      render(<RoleSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("User")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("should call onChange when All selected", () => {
      render(<RoleSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      fireEvent.click(screen.getByText("All"));
      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("should call onChange when User selected", () => {
      render(<RoleSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      fireEvent.click(screen.getByText("User"));
      expect(mockOnChange).toHaveBeenCalledWith("USER");
    });

    it("should call onChange when Admin selected", () => {
      render(<RoleSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      fireEvent.click(screen.getByText("Admin"));
      expect(mockOnChange).toHaveBeenCalledWith("ADMIN");
    });

    it("should close dropdown after selection", async () => {
      render(<RoleSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const userButton = screen.getAllByText("User")[0];
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.queryByText("Admin")).not.toBeInTheDocument();
      });
    });

    it("should display selected role", () => {
      render(<RoleSelect {...defaultProps} value="USER" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("User");
    });

    it("should display Admin when selected", () => {
      render(<RoleSelect {...defaultProps} value="ADMIN" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("Admin");
    });

    it("should highlight selected role in dropdown", () => {
      render(<RoleSelect {...defaultProps} value="ADMIN" />);
      fireEvent.click(screen.getByRole("textbox"));

      const adminButton = screen.getByText("Admin").closest("button");
      expect(adminButton).toHaveClass("bg-primary-900/40");
      expect(adminButton).toHaveClass("text-primary-300");
    });

    it("should show checkmark for selected role", () => {
      render(<RoleSelect {...defaultProps} value="USER" />);
      fireEvent.click(screen.getByRole("textbox"));

      const userButton = screen.getAllByText("User")[0].closest("button");
      expect(userButton?.textContent).toContain("✓");
    });
  });

  describe("Input Behavior", () => {
    it("should be readonly", () => {
      render(<RoleSelect {...defaultProps} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.readOnly).toBe(true);
    });

    it("should have cursor pointer style", () => {
      render(<RoleSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("cursor-pointer");
    });
  });

  describe("Error State", () => {
    it("should apply error border", () => {
      render(<RoleSelect {...defaultProps} error="Required" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-red-500");
    });

    it("should show error message", () => {
      render(<RoleSelect {...defaultProps} error="This field is required" />);
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("should apply error text color", () => {
      render(<RoleSelect {...defaultProps} error="Error" />);
      const errorText = screen.getByText("Error");
      expect(errorText).toHaveClass("text-red-400");
    });
  });

  describe("Styling", () => {
    it("should apply focus ring", () => {
      render(<RoleSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("focus:ring-2");
      expect(input).toHaveClass("focus:ring-primary-500");
    });

    it("should apply hover styles to options", () => {
      render(<RoleSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const allButton = screen.getByText("All").closest("button");
      expect(allButton).toHaveClass("hover:bg-[#252525]");
    });

    it("should have text color based on selection", () => {
      const { rerender } = render(<RoleSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("text-gray-500");

      rerender(<RoleSelect {...defaultProps} value="USER" />);
      expect(input).toHaveClass("text-gray-200");
    });
  });

  describe("Value Sync", () => {
    it("should update display when value prop changes", () => {
      const { rerender } = render(
        <RoleSelect {...defaultProps} value="USER" />
      );
      let input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("User");

      rerender(<RoleSelect {...defaultProps} value="ADMIN" />);
      input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("Admin");
    });

    it("should show All when value is empty", () => {
      render(<RoleSelect {...defaultProps} value="" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("All");
    });

    it("should handle undefined value", () => {
      render(<RoleSelect {...defaultProps} value={undefined} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });
  });

  describe("Accessibility", () => {
    it("should have button type for chevron", () => {
      const { container } = render(<RoleSelect {...defaultProps} />);
      const chevronButton = container.querySelector(".lucide-chevron-down")
        ?.parentElement as HTMLButtonElement;
      expect(chevronButton.type).toBe("button");
    });

    it("should have label association", () => {
      render(<RoleSelect {...defaultProps} label="Role" />);
      const label = screen.getByText("Role");
      expect(label.tagName).toBe("LABEL");
    });

    it("should have option buttons with type", () => {
      render(<RoleSelect {...defaultProps} />);
      fireEvent.click(screen.getByRole("textbox"));

      const userButton = screen
        .getAllByText("User")[0]
        .closest("button") as HTMLButtonElement;
      expect(userButton.type).toBe("button");
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid toggle", () => {
      render(<RoleSelect {...defaultProps} />);
      const input = screen.getByRole("textbox");

      fireEvent.click(input);
      fireEvent.click(input);
      fireEvent.click(input);

      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("should handle multiple selections", () => {
      render(<RoleSelect {...defaultProps} />);

      fireEvent.click(screen.getByRole("textbox"));
      fireEvent.click(screen.getAllByText("User")[0]);
      expect(mockOnChange).toHaveBeenCalledWith("USER");

      fireEvent.click(screen.getByRole("textbox"));
      fireEvent.click(screen.getByText("Admin"));
      expect(mockOnChange).toHaveBeenCalledWith("ADMIN");

      expect(mockOnChange).toHaveBeenCalledTimes(2);
    });

    it("should handle all props together", () => {
      render(
        <RoleSelect
          {...defaultProps}
          label="User Role"
          value="ADMIN"
          placeholder="Choose"
          required={true}
          error="Required"
        />
      );

      expect(screen.getByText("User Role")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("Admin");
      expect(screen.getByText("Required")).toBeInTheDocument();
    });
  });
});
