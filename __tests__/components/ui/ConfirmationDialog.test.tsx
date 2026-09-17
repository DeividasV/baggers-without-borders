import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import ConfirmationDialog from "@/app/components/ui/ConfirmationDialog";

describe("ConfirmationDialog Component", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render when isOpen is true", () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByText("Confirm Action")).toBeInTheDocument();
      expect(
        screen.getByText("Are you sure you want to proceed?")
      ).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
      render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByText("Confirm Action")).not.toBeInTheDocument();
    });

    it("should render title", () => {
      render(<ConfirmationDialog {...defaultProps} title="Delete User" />);
      expect(screen.getByText("Delete User")).toBeInTheDocument();
    });

    it("should render message", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          message="This action cannot be undone."
        />
      );
      expect(
        screen.getByText("This action cannot be undone.")
      ).toBeInTheDocument();
    });

    it("should render default buttons", () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByText("Confirm")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should render custom button text", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          confirmText="Delete"
          cancelText="Keep"
        />
      );
      expect(screen.getByText("Delete")).toBeInTheDocument();
      expect(screen.getByText("Keep")).toBeInTheDocument();
    });
  });

  describe("Variant Styles", () => {
    it("should render danger variant by default", () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      const confirmButton = screen.getByText("Confirm");
      expect(confirmButton).toHaveClass("bg-red-600");
    });

    it("should render warning variant", () => {
      const { container } = render(
        <ConfirmationDialog {...defaultProps} variant="warning" />
      );
      const confirmButton = screen.getByText("Confirm");
      expect(confirmButton).toHaveClass("bg-yellow-600");
    });

    it("should render info variant", () => {
      const { container } = render(
        <ConfirmationDialog {...defaultProps} variant="info" />
      );
      const confirmButton = screen.getByText("Confirm");
      expect(confirmButton).toHaveClass("bg-blue-600");
    });
  });

  describe("Button Actions", () => {
    it("should call onConfirm when confirm button clicked", () => {
      const onConfirm = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
      fireEvent.click(screen.getByText("Confirm"));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when cancel button clicked", () => {
      const onClose = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText("Cancel"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when X button clicked", () => {
      const onClose = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      const closeButton = screen.getByLabelText("Close dialog");
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Loading State", () => {
    it("should show loading text when loading", () => {
      render(<ConfirmationDialog {...defaultProps} loading={true} />);
      expect(screen.getByText("Processing...")).toBeInTheDocument();
      expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
    });

    it("should disable buttons when loading", () => {
      render(<ConfirmationDialog {...defaultProps} loading={true} />);
      expect(screen.getByText("Processing...")).toBeDisabled();
      expect(screen.getByText("Cancel")).toBeDisabled();
    });

    it("should disable close button when loading", () => {
      render(<ConfirmationDialog {...defaultProps} loading={true} />);
      const closeButton = screen.getByLabelText("Close dialog");
      expect(closeButton).toBeDisabled();
    });

    it("should not close on backdrop click when loading", () => {
      const onClose = jest.fn();
      const { container } = render(
        <ConfirmationDialog
          {...defaultProps}
          onClose={onClose}
          loading={true}
        />
      );
      const backdrop = container.querySelector(".fixed.inset-0");
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).not.toHaveBeenCalled();
      }
    });
  });

  describe("Backdrop Behavior", () => {
    it("should close on backdrop click", () => {
      const onClose = jest.fn();
      const { container } = render(
        <ConfirmationDialog {...defaultProps} onClose={onClose} />
      );
      const backdrop = container.querySelector(".fixed.inset-0");
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it("should not close when clicking dialog content", () => {
      const onClose = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      const title = screen.getByText("Confirm Action");
      fireEvent.click(title);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should close on Escape key", () => {
      const onClose = jest.fn();
      const { container } = render(
        <ConfirmationDialog {...defaultProps} onClose={onClose} />
      );
      const dialog = container.querySelector('[role="dialog"]');
      if (dialog) {
        fireEvent.keyDown(dialog, { key: "Escape" });
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it("should not close on Escape when loading", () => {
      const onClose = jest.fn();
      const { container } = render(
        <ConfirmationDialog
          {...defaultProps}
          onClose={onClose}
          loading={true}
        />
      );
      const dialog = container.querySelector('[role="dialog"]');
      if (dialog) {
        fireEvent.keyDown(dialog, { key: "Escape" });
        expect(onClose).not.toHaveBeenCalled();
      }
    });
  });

  describe("Custom Icon", () => {
    it("should render default icon", () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      const icon = container.querySelector(".lucide-triangle-alert");
      expect(icon).toBeInTheDocument();
    });

    it("should render custom icon", () => {
      const customIcon = <div data-testid="custom-icon">Custom</div>;
      render(<ConfirmationDialog {...defaultProps} icon={customIcon} />);
      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });
  });

  describe("Message Formatting", () => {
    it("should handle multiline messages", () => {
      const multilineMessage = "Line 1\nLine 2\nLine 3";
      render(
        <ConfirmationDialog {...defaultProps} message={multilineMessage} />
      );
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Line 2/)).toBeInTheDocument();
      expect(screen.getByText(/Line 3/)).toBeInTheDocument();
    });

    it("should handle long messages", () => {
      const longMessage =
        "This is a very long message that should wrap properly and be displayed correctly in the dialog without breaking the layout or causing any visual issues.";
      render(<ConfirmationDialog {...defaultProps} message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have dialog role", () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it("should have aria-modal", () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("should have aria-labelledby", () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveAttribute(
        "aria-labelledby",
        "confirmation-dialog-title"
      );
    });

    it("should have close button with aria-label", () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByLabelText("Close dialog")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle all props together", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          variant="warning"
          confirmText="Proceed"
          cancelText="Abort"
          loading={false}
          icon={<div>Icon</div>}
        />
      );
      expect(screen.getByText("Confirm Action")).toBeInTheDocument();
      expect(screen.getByText("Proceed")).toBeInTheDocument();
      expect(screen.getByText("Abort")).toBeInTheDocument();
    });

    it("should handle empty message", () => {
      render(<ConfirmationDialog {...defaultProps} message="" />);
      expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    });
  });

  describe("Text Confirmation Functionality", () => {
    it("should render text input when requireTextConfirmation is provided", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          requireTextConfirmation={{
            expectedText: "DELETE",
            placeholder: "Type DELETE to confirm",
            instructionText: "This action is irreversible",
          }}
        />
      );

      const input = screen.getByPlaceholderText("Type DELETE to confirm");
      expect(input).toBeInTheDocument();
      expect(
        screen.getByText("This action is irreversible")
      ).toBeInTheDocument();
    });

    it("should disable confirm button when text does not match", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          requireTextConfirmation={{
            expectedText: "DELETE",
            placeholder: "Type DELETE to confirm",
          }}
        />
      );

      const confirmButton = screen.getByText("Confirm");
      expect(confirmButton).toBeDisabled();
    });

    it("should enable confirm button when text matches exactly", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          requireTextConfirmation={{
            expectedText: "DELETE",
            placeholder: "Type DELETE to confirm",
          }}
        />
      );

      const input = screen.getByPlaceholderText("Type DELETE to confirm");
      const confirmButton = screen.getByText("Confirm");

      fireEvent.change(input, { target: { value: "DELETE" } });

      expect(confirmButton).not.toBeDisabled();
    });

    it("should enable confirm button with case-insensitive matching", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          requireTextConfirmation={{
            expectedText: "DELETE",
            placeholder: "Type DELETE to confirm",
          }}
        />
      );

      const input = screen.getByPlaceholderText("Type DELETE to confirm");
      const confirmButton = screen.getByText("Confirm");

      // Test lowercase
      fireEvent.change(input, { target: { value: "delete" } });
      expect(confirmButton).not.toBeDisabled();

      // Test mixed case
      fireEvent.change(input, { target: { value: "DeLeTe" } });
      expect(confirmButton).not.toBeDisabled();
    });

    it("should trim whitespace when matching text", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          requireTextConfirmation={{
            expectedText: "DELETE",
            placeholder: "Type DELETE to confirm",
          }}
        />
      );

      const input = screen.getByPlaceholderText("Type DELETE to confirm");
      const confirmButton = screen.getByText("Confirm");

      // Test with leading/trailing whitespace
      fireEvent.change(input, { target: { value: "  DELETE  " } });
      expect(confirmButton).not.toBeDisabled();
    });

    it("should work with member names as confirmation text", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          requireTextConfirmation={{
            expectedText: "John",
            placeholder: "Type John to confirm",
          }}
        />
      );

      const input = screen.getByPlaceholderText("Type John to confirm");
      const confirmButton = screen.getByText("Confirm");

      expect(confirmButton).toBeDisabled();

      fireEvent.change(input, { target: { value: "John" } });
      expect(confirmButton).not.toBeDisabled();

      fireEvent.change(input, { target: { value: "john" } });
      expect(confirmButton).not.toBeDisabled();
    });

    it("should keep confirm button disabled for partial matches", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          requireTextConfirmation={{
            expectedText: "DELETE",
            placeholder: "Type DELETE to confirm",
          }}
        />
      );

      const input = screen.getByPlaceholderText("Type DELETE to confirm");
      const confirmButton = screen.getByText("Confirm");

      fireEvent.change(input, { target: { value: "DEL" } });
      expect(confirmButton).toBeDisabled();

      fireEvent.change(input, { target: { value: "DELETED" } });
      expect(confirmButton).toBeDisabled();
    });

    it("should call onConfirm only when text matches and button is clicked", () => {
      const onConfirm = jest.fn();
      render(
        <ConfirmationDialog
          {...defaultProps}
          onConfirm={onConfirm}
          requireTextConfirmation={{
            expectedText: "DELETE",
            placeholder: "Type DELETE to confirm",
          }}
        />
      );

      const input = screen.getByPlaceholderText("Type DELETE to confirm");
      const confirmButton = screen.getByText("Confirm");

      // Try to click without entering text (button should be disabled)
      fireEvent.click(confirmButton);
      expect(onConfirm).not.toHaveBeenCalled();

      // Enter correct text
      fireEvent.change(input, { target: { value: "DELETE" } });

      // Now click should work
      fireEvent.click(confirmButton);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("should disable text input when loading", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          loading={true}
          requireTextConfirmation={{
            expectedText: "DELETE",
            placeholder: "Type DELETE to confirm",
          }}
        />
      );

      const input = screen.getByPlaceholderText("Type DELETE to confirm");
      expect(input).toBeDisabled();
    });

    it("should use default placeholder when not provided", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          requireTextConfirmation={{
            expectedText: "DELETE",
          }}
        />
      );

      const input = screen.getByPlaceholderText("Type to confirm");
      expect(input).toBeInTheDocument();
    });

    it("should not render instruction text when not provided", () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          requireTextConfirmation={{
            expectedText: "DELETE",
            placeholder: "Type DELETE to confirm",
          }}
        />
      );

      expect(
        screen.queryByText("This action is irreversible")
      ).not.toBeInTheDocument();
    });
  });
});
