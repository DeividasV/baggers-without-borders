import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import Switch from "@/app/components/ui/Switch";

describe("Switch Component", () => {
  const defaultProps = {
    checked: false,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render switch button", () => {
      render(<Switch {...defaultProps} />);
      const switchButton = screen.getByRole("switch");
      expect(switchButton).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<Switch {...defaultProps} label="Enable notifications" />);
      expect(screen.getByText("Enable notifications")).toBeInTheDocument();
    });

    it("should render without label", () => {
      render(<Switch {...defaultProps} />);
      expect(screen.queryByRole("label")).not.toBeInTheDocument();
    });
  });

  describe("Checked State", () => {
    it("should reflect checked state", () => {
      render(<Switch {...defaultProps} checked={true} />);
      const switchButton = screen.getByRole("switch");
      expect(switchButton).toHaveAttribute("aria-checked", "true");
    });

    it("should reflect unchecked state", () => {
      render(<Switch {...defaultProps} checked={false} />);
      const switchButton = screen.getByRole("switch");
      expect(switchButton).toHaveAttribute("aria-checked", "false");
    });

    it("should apply checked styles", () => {
      render(<Switch {...defaultProps} checked={true} />);
      const switchButton = screen.getByRole("switch");
      expect(switchButton).toHaveClass("bg-primary-600");
    });

    it("should apply unchecked styles", () => {
      render(<Switch {...defaultProps} checked={false} />);
      const switchButton = screen.getByRole("switch");
      expect(switchButton).toHaveClass("bg-gray-600");
    });
  });

  describe("Toggle Behavior", () => {
    it("should call onChange when clicked", () => {
      const onChange = jest.fn();
      render(<Switch {...defaultProps} checked={false} onChange={onChange} />);
      const switchButton = screen.getByRole("switch");
      fireEvent.click(switchButton);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("should toggle from checked to unchecked", () => {
      const onChange = jest.fn();
      render(<Switch {...defaultProps} checked={true} onChange={onChange} />);
      const switchButton = screen.getByRole("switch");
      fireEvent.click(switchButton);
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it("should toggle multiple times", () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <Switch {...defaultProps} checked={false} onChange={onChange} />
      );
      const switchButton = screen.getByRole("switch");

      fireEvent.click(switchButton);
      expect(onChange).toHaveBeenCalledWith(true);

      rerender(<Switch {...defaultProps} checked={true} onChange={onChange} />);
      fireEvent.click(switchButton);
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Label Interaction", () => {
    it("should toggle when label is clicked", () => {
      const onChange = jest.fn();
      render(
        <Switch
          {...defaultProps}
          checked={false}
          onChange={onChange}
          label="Enable feature"
        />
      );
      const label = screen.getByText("Enable feature");
      fireEvent.click(label);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("should connect label to switch with id", () => {
      render(<Switch {...defaultProps} label="My Switch" id="my-switch" />);
      const switchButton = screen.getByRole("switch");
      const label = screen.getByText("My Switch");
      expect(switchButton).toHaveAttribute("id", "my-switch");
      expect(label).toHaveAttribute("for", "my-switch");
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(<Switch {...defaultProps} disabled={true} />);
      const switchButton = screen.getByRole("switch");
      expect(switchButton).toBeDisabled();
    });

    it("should not call onChange when disabled and clicked", () => {
      const onChange = jest.fn();
      render(<Switch {...defaultProps} disabled={true} onChange={onChange} />);
      const switchButton = screen.getByRole("switch");
      fireEvent.click(switchButton);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should not toggle via label when disabled", () => {
      const onChange = jest.fn();
      render(
        <Switch
          {...defaultProps}
          disabled={true}
          onChange={onChange}
          label="Disabled Switch"
        />
      );
      const label = screen.getByText("Disabled Switch");
      fireEvent.click(label);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should apply disabled styles", () => {
      render(<Switch {...defaultProps} disabled={true} />);
      const switchButton = screen.getByRole("switch");
      expect(switchButton).toHaveClass("opacity-50");
      expect(switchButton).toHaveClass("cursor-not-allowed");
    });

    it("should apply disabled styles to label", () => {
      render(<Switch {...defaultProps} disabled={true} label="Disabled" />);
      const label = screen.getByText("Disabled");
      expect(label).toHaveClass("text-gray-500");
      expect(label).toHaveClass("cursor-not-allowed");
    });
  });

  describe("Styling", () => {
    it("should have transition classes", () => {
      render(<Switch {...defaultProps} />);
      const switchButton = screen.getByRole("switch");
      expect(switchButton).toHaveClass("transition-colors");
    });

    it("should have rounded classes", () => {
      render(<Switch {...defaultProps} />);
      const switchButton = screen.getByRole("switch");
      expect(switchButton).toHaveClass("rounded-full");
    });

    it("should have focus ring", () => {
      render(<Switch {...defaultProps} />);
      const switchButton = screen.getByRole("switch");
      expect(switchButton).toHaveClass("focus:ring-2");
      expect(switchButton).toHaveClass("focus:ring-primary-500");
    });
  });

  describe("Toggle Animation", () => {
    it("should position toggle left when unchecked", () => {
      const { container } = render(
        <Switch {...defaultProps} checked={false} />
      );
      const toggle = container.querySelector(".translate-x-1");
      expect(toggle).toBeInTheDocument();
    });

    it("should position toggle right when checked", () => {
      const { container } = render(<Switch {...defaultProps} checked={true} />);
      const toggle = container.querySelector(".translate-x-6");
      expect(toggle).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have switch role", () => {
      render(<Switch {...defaultProps} />);
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("should have aria-checked attribute", () => {
      render(<Switch {...defaultProps} checked={true} />);
      const switchButton = screen.getByRole("switch");
      expect(switchButton).toHaveAttribute("aria-checked", "true");
    });

    it("should be keyboard accessible", () => {
      render(<Switch {...defaultProps} />);
      const switchButton = screen.getByRole("switch");
      switchButton.focus();
      expect(document.activeElement).toBe(switchButton);
    });

    it("should have type button", () => {
      render(<Switch {...defaultProps} />);
      const switchButton = screen.getByRole("switch");
      expect(switchButton).toHaveAttribute("type", "button");
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid toggling", () => {
      const onChange = jest.fn();
      render(<Switch {...defaultProps} onChange={onChange} />);
      const switchButton = screen.getByRole("switch");

      fireEvent.click(switchButton);
      fireEvent.click(switchButton);
      fireEvent.click(switchButton);

      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it("should render with all props", () => {
      render(
        <Switch
          checked={true}
          onChange={jest.fn()}
          label="Full Switch"
          disabled={false}
          id="full-switch"
        />
      );
      expect(screen.getByText("Full Switch")).toBeInTheDocument();
      expect(screen.getByRole("switch")).toHaveAttribute("id", "full-switch");
    });

    it("should handle long label text", () => {
      const longLabel =
        "This is a very long label text that should wrap or display correctly";
      render(<Switch {...defaultProps} label={longLabel} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });
  });
});
