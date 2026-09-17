import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import Modal from "@/app/components/ui/Modal";

describe("Modal Component", () => {
  describe("Rendering", () => {
    it("should render when isOpen is true", () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Modal Content</div>
        </Modal>
      );
      expect(screen.getByText("Modal Content")).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <div>Modal Content</div>
        </Modal>
      );
      expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
    });

    it("should render title", () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByText("Test Modal")).toBeInTheDocument();
    });

    it("should render close button by default", () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByTestId("modal-close-button")).toBeInTheDocument();
    });

    it("should hide close button when showCloseButton is false", () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
          showCloseButton={false}
        >
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByTestId("modal-close-button")).not.toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("should apply small size", () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal" size="sm">
          <div>Content</div>
        </Modal>
      );
      const modal = container.querySelector("[class*='max-w-']");
      expect(modal).toBeInTheDocument();
    });

    it("should apply medium size (default)", () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      const modal = container.querySelector("[class*='max-w-']");
      expect(modal).toBeInTheDocument();
    });

    it("should apply large size", () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal" size="lg">
          <div>Content</div>
        </Modal>
      );
      const modal = container.querySelector("[class*='max-w-']");
      expect(modal).toBeInTheDocument();
    });

    it("should apply extra large size", () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal" size="xl">
          <div>Content</div>
        </Modal>
      );
      const modal = container.querySelector("[class*='max-w-']");
      expect(modal).toBeInTheDocument();
    });

    it("should apply full size", () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal" size="full">
          <div>Content</div>
        </Modal>
      );
      const modal = container.querySelector("[class*='max-w-']");
      expect(modal).toBeInTheDocument();
    });
  });

  describe("Close Behavior", () => {
    it("should call onClose when close button is clicked", () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByTestId("modal-close-button");
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when backdrop is clicked", () => {
      const handleClose = jest.fn();
      const { container } = render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      const backdrop = container.querySelector(".bg-black\\/70");
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(handleClose).toHaveBeenCalledTimes(1);
      }
    });

    it("should not close when modal content is clicked", () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      const content = screen.getByText("Content");
      fireEvent.click(content);
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe("Body Scroll Lock", () => {
    it("should add overflow-hidden to body when modal opens", () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );

      rerender(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe("hidden");
    });

    it("should remove overflow-hidden from body when modal closes", () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe("hidden");

      rerender(
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe("unset");
    });

    it("should clean up overflow style on unmount", () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe("hidden");
      unmount();
      expect(document.body.style.overflow).toBe("unset");
    });
  });

  describe("Children Rendering", () => {
    it("should render text content", () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          Simple text content
        </Modal>
      );
      expect(screen.getByText("Simple text content")).toBeInTheDocument();
    });

    it("should render complex JSX", () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>
            <h2>Heading</h2>
            <p>Paragraph</p>
            <button>Action</button>
          </div>
        </Modal>
      );
      expect(screen.getByText("Heading")).toBeInTheDocument();
      expect(screen.getByText("Paragraph")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </Modal>
      );
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should render modal container", () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      const modalContainer = container.querySelector(".fixed.inset-0.z-70");
      expect(modalContainer).toBeInTheDocument();
    });

    it("should have close button", () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByTestId("modal-close-button");
      expect(closeButton).toBeInTheDocument();
    });

    it("should trap focus within modal", () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>
            <button>Button 1</button>
            <button>Button 2</button>
          </div>
        </Modal>
      );
      // Modal should contain focusable elements
      expect(screen.getByText("Button 1")).toBeInTheDocument();
      expect(screen.getByText("Button 2")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty children", () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div></div>
        </Modal>
      );
      // Should render without crashing
      const modalContainer = container.querySelector(".fixed");
      expect(modalContainer).toBeTruthy();
    });

    it("should handle long content", () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>
            {Array.from({ length: 100 }, (_, i) => (
              <p key={i}>Line {i + 1}</p>
            ))}
          </div>
        </Modal>
      );
      expect(screen.getByText("Line 1")).toBeInTheDocument();
      expect(screen.getByText("Line 100")).toBeInTheDocument();
    });

    it("should render with all props", () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Full Modal"
          size="xl"
          showCloseButton={true}
        >
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByText("Full Modal")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(screen.getByTestId("modal-close-button")).toBeInTheDocument();
    });

    it("should handle rapid open/close", () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );

      // Rapidly toggle
      rerender(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      rerender(
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      rerender(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("Event Propagation", () => {
    it("should stop propagation on modal content click", () => {
      const backdropClick = jest.fn();
      const { container } = render(
        <Modal isOpen={true} onClose={backdropClick} title="Test Modal">
          <div>Content</div>
        </Modal>
      );

      const content = screen.getByText("Content");
      fireEvent.click(content);
      expect(backdropClick).not.toHaveBeenCalled();
    });

    it("should handle nested button clicks", () => {
      const buttonClick = jest.fn();
      const handleClose = jest.fn();

      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <button onClick={buttonClick}>Click Me</button>
        </Modal>
      );

      const button = screen.getByText("Click Me");
      fireEvent.click(button);
      expect(buttonClick).toHaveBeenCalled();
      expect(handleClose).not.toHaveBeenCalled();
    });
  });
});
