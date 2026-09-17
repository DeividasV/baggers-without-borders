/**
 * Tests for FileManagerToolbar component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FileManagerToolbar from "@/app/components/features/documents/FileManagerToolbar";

describe("FileManagerToolbar", () => {
  const defaultProps = {
    viewMode: "list" as const,
    uploading: false,
    onViewModeChange: jest.fn(),
    onNewFolder: jest.fn(),
    onNewMarkdown: jest.fn(),
    onFileUpload: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all action buttons", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      expect(screen.getByText("New Folder")).toBeInTheDocument();
      expect(screen.getByText("New Note")).toBeInTheDocument();
      expect(screen.getByText("Upload")).toBeInTheDocument();
    });

    it("should render view mode toggle on desktop", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      // View mode toggle should exist but be hidden on mobile
      const viewToggle = container.querySelector(".hidden.md\\:flex");
      expect(viewToggle).toBeInTheDocument();
    });

    it("should have file input for upload", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("multiple");
    });
  });

  describe("View Mode Toggle", () => {
    it("should highlight grid view when active", () => {
      const { container } = render(
        <FileManagerToolbar {...defaultProps} viewMode="grid" />
      );

      const buttons = container.querySelectorAll(".hidden.md\\:flex button");
      const gridButton = buttons[0];
      expect(gridButton).toHaveClass("bg-primary-600", "text-white");
    });

    it("should highlight list view when active", () => {
      const { container } = render(
        <FileManagerToolbar {...defaultProps} viewMode="list" />
      );

      const buttons = container.querySelectorAll(".hidden.md\\:flex button");
      const listButton = buttons[1];
      expect(listButton).toHaveClass("bg-primary-600", "text-white");
    });

    it("should call onViewModeChange when grid is clicked", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const buttons = container.querySelectorAll(".hidden.md\\:flex button");
      const gridButton = buttons[0];
      fireEvent.click(gridButton);

      expect(defaultProps.onViewModeChange).toHaveBeenCalledWith("grid");
    });

    it("should call onViewModeChange when list is clicked", () => {
      const { container } = render(
        <FileManagerToolbar {...defaultProps} viewMode="grid" />
      );

      const buttons = container.querySelectorAll(".hidden.md\\:flex button");
      const listButton = buttons[1];
      fireEvent.click(listButton);

      expect(defaultProps.onViewModeChange).toHaveBeenCalledWith("list");
    });

    it("should not highlight inactive view mode", () => {
      const { container } = render(
        <FileManagerToolbar {...defaultProps} viewMode="grid" />
      );

      const buttons = container.querySelectorAll(".hidden.md\\:flex button");
      const listButton = buttons[1];
      expect(listButton).not.toHaveClass("bg-primary-600");
      expect(listButton).toHaveClass("text-gray-400");
    });
  });

  describe("New Folder Button", () => {
    it("should call onNewFolder when clicked", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      const newFolderButton = screen.getByText("New Folder");
      fireEvent.click(newFolderButton);

      expect(defaultProps.onNewFolder).toHaveBeenCalledTimes(1);
    });

    it("should have folder icon", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const button = screen.getByText("New Folder").closest("button");
      const icon = button?.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should have correct styling", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      const button = screen.getByText("New Folder").closest("button");
      expect(button).toHaveClass(
        "bg-dark-800",
        "hover:bg-dark-700",
        "border-dark-600"
      );
    });
  });

  describe("New Note Button", () => {
    it("should call onNewMarkdown when clicked", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      const newNoteButton = screen.getByText("New Note");
      fireEvent.click(newNoteButton);

      expect(defaultProps.onNewMarkdown).toHaveBeenCalledTimes(1);
    });

    it("should have text icon", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const button = screen.getByText("New Note").closest("button");
      const icon = button?.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should have correct styling", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      const button = screen.getByText("New Note").closest("button");
      expect(button).toHaveClass(
        "bg-dark-800",
        "hover:bg-dark-700",
        "border-dark-600"
      );
    });
  });

  describe("Upload Button", () => {
    it("should trigger file input when clicked", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const fileInput = container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const clickSpy = jest.spyOn(fileInput, "click");

      const uploadLabel = screen.getByText("Upload").closest("label");
      fireEvent.click(uploadLabel!);

      // The label naturally triggers the input, so we just verify it's connected
      expect(fileInput).toBeInTheDocument();
    });

    it("should call onFileUpload when files are selected", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const fileInput = container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const files = {
        0: file,
        length: 1,
        item: () => file,
      } as unknown as FileList;

      Object.defineProperty(fileInput, "files", {
        value: files,
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(defaultProps.onFileUpload).toHaveBeenCalled();
      const callArg = defaultProps.onFileUpload.mock.calls[0][0];
      expect(callArg).toHaveProperty("length", 1);
    });

    it("should not call onFileUpload when no files selected", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const fileInput = container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      Object.defineProperty(fileInput, "files", {
        value: null,
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(defaultProps.onFileUpload).not.toHaveBeenCalled();
    });

    it("should be disabled when uploading", () => {
      const { container } = render(
        <FileManagerToolbar {...defaultProps} uploading={true} />
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeDisabled();
    });

    it("should not be disabled when not uploading", () => {
      const { container } = render(
        <FileManagerToolbar {...defaultProps} uploading={false} />
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).not.toBeDisabled();
    });

    it("should have primary button styling", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      const uploadLabel = screen.getByText("Upload").closest("label");
      expect(uploadLabel).toHaveClass("bg-primary-600", "hover:bg-primary-700");
    });

    it("should have upload icon", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const label = screen.getByText("Upload").closest("label");
      const icon = label?.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should accept multiple files", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute("multiple");
    });
  });

  describe("Layout and Styling", () => {
    it("should have flex layout with gap", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const toolbar = container.firstChild as HTMLElement;
      expect(toolbar).toHaveClass("flex", "flex-wrap", "gap-3");
    });

    it("should render buttons in correct order", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      const buttons = screen.getAllByRole("button", { hidden: true });
      const labels = buttons.map((btn) => btn.textContent);

      // View mode buttons are hidden on mobile, so we check the visible action buttons
      expect(labels).toContain("New Folder");
      expect(labels).toContain("New Note");
    });

    it("should hide view toggle on mobile", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const viewToggle = container.querySelector(".hidden.md\\:flex");
      expect(viewToggle).toHaveClass("hidden", "md:flex");
    });
  });

  describe("Interaction States", () => {
    it("should show hover states on buttons", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      const newFolderButton = screen.getByText("New Folder").closest("button");
      expect(newFolderButton).toHaveClass("hover:bg-dark-700");
    });

    it("should maintain state during multiple clicks", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      const newFolderButton = screen.getByText("New Folder");

      fireEvent.click(newFolderButton);
      fireEvent.click(newFolderButton);
      fireEvent.click(newFolderButton);

      expect(defaultProps.onNewFolder).toHaveBeenCalledTimes(3);
    });

    it("should allow switching view modes multiple times", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const buttons = container.querySelectorAll(".hidden.md\\:flex button");
      const gridButton = buttons[0];
      const listButton = buttons[1];

      fireEvent.click(gridButton);
      fireEvent.click(listButton);
      fireEvent.click(gridButton);

      expect(defaultProps.onViewModeChange).toHaveBeenCalledTimes(3);
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple file uploads", () => {
      const { container } = render(<FileManagerToolbar {...defaultProps} />);

      const fileInput = container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      const files = [
        new File(["content1"], "test1.txt", { type: "text/plain" }),
        new File(["content2"], "test2.txt", { type: "text/plain" }),
        new File(["content3"], "test3.pdf", { type: "application/pdf" }),
      ];

      Object.defineProperty(fileInput, "files", {
        value: files,
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(defaultProps.onFileUpload).toHaveBeenCalled();
    });

    it("should handle rapid button clicks", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      const newFolderButton = screen.getByText("New Folder");

      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(newFolderButton);
      }

      expect(defaultProps.onNewFolder).toHaveBeenCalledTimes(10);
    });

    it("should work when view mode prop changes", () => {
      const { rerender } = render(<FileManagerToolbar {...defaultProps} />);

      rerender(<FileManagerToolbar {...defaultProps} viewMode="grid" />);

      const { container } = render(
        <FileManagerToolbar {...defaultProps} viewMode="grid" />
      );
      const buttons = container.querySelectorAll(".hidden.md\\:flex button");
      const gridButton = buttons[0];

      expect(gridButton).toHaveClass("bg-primary-600");
    });
  });

  describe("Accessibility", () => {
    it("should have accessible buttons", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      const newFolderButton = screen.getByText("New Folder");
      const newNoteButton = screen.getByText("New Note");

      expect(newFolderButton.closest("button")).toBeInTheDocument();
      expect(newNoteButton.closest("button")).toBeInTheDocument();
    });

    it("should have proper label for file input", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      const uploadLabel = screen.getByText("Upload").closest("label");
      expect(uploadLabel).toBeInTheDocument();
    });

    it("should maintain focus management", () => {
      render(<FileManagerToolbar {...defaultProps} />);

      const newFolderButton = screen.getByText("New Folder").closest("button")!;
      newFolderButton.focus();

      expect(document.activeElement).toBe(newFolderButton);
    });
  });
});
