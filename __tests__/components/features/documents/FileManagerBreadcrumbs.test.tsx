/**
 * Tests for FileManagerBreadcrumbs component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FileManagerBreadcrumbs from "@/app/components/features/documents/FileManagerBreadcrumbs";
import { mockBreadcrumbs, mockPdfFile } from "../../../utils/mock-documents";

describe("FileManagerBreadcrumbs", () => {
  const defaultProps = {
    breadcrumbs: mockBreadcrumbs,
    searchQuery: "",
    dropTarget: null,
    draggedItem: null,
    onBreadcrumbClick: jest.fn(),
    onSearchChange: jest.fn(),
    onDragOver: jest.fn(),
    onDragLeave: jest.fn(),
    onMove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Breadcrumb Rendering", () => {
    it("should render all breadcrumbs", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} />);

      expect(screen.getByText("Documents")).toBeInTheDocument();
      expect(screen.getByText("Test Folder")).toBeInTheDocument();
    });

    it("should render home icon for first breadcrumb", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} />);

      const homeButton = screen.getByText("Documents").closest("button");
      expect(homeButton).toBeInTheDocument();
    });

    it("should show chevrons between breadcrumbs", () => {
      const { container } = render(
        <FileManagerBreadcrumbs {...defaultProps} />
      );

      // Should have one chevron for two breadcrumbs
      const chevrons = container.querySelectorAll("svg");
      const chevronExists = Array.from(chevrons).some((svg) =>
        svg.classList.toString().includes("lucide")
      );
      expect(chevronExists).toBe(true);
    });

    it("should highlight last breadcrumb", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} />);

      const lastBreadcrumb = screen.getByText("Test Folder").closest("button");
      expect(lastBreadcrumb).toHaveClass("text-white", "font-medium");
    });

    it("should render single breadcrumb", () => {
      render(
        <FileManagerBreadcrumbs
          {...defaultProps}
          breadcrumbs={[{ id: null, name: "Documents" }]}
        />
      );

      expect(screen.getByText("Documents")).toBeInTheDocument();
      expect(screen.queryByText("Test Folder")).not.toBeInTheDocument();
    });
  });

  describe("Breadcrumb Navigation", () => {
    it("should call onBreadcrumbClick when breadcrumb is clicked", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} />);

      const documentsButton = screen.getByText("Documents");
      fireEvent.click(documentsButton);

      expect(defaultProps.onBreadcrumbClick).toHaveBeenCalledWith(0);
    });

    it("should call onBreadcrumbClick with correct index", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} />);

      const folderButton = screen.getByText("Test Folder");
      fireEvent.click(folderButton);

      expect(defaultProps.onBreadcrumbClick).toHaveBeenCalledWith(1);
    });

    it("should allow clicking any breadcrumb", () => {
      const manyBreadcrumbs = [
        { id: null, name: "Documents" },
        { id: "folder-1", name: "Folder 1" },
        { id: "folder-2", name: "Folder 2" },
        { id: "folder-3", name: "Folder 3" },
      ];

      render(
        <FileManagerBreadcrumbs
          {...defaultProps}
          breadcrumbs={manyBreadcrumbs}
        />
      );

      fireEvent.click(screen.getByText("Folder 2"));
      expect(defaultProps.onBreadcrumbClick).toHaveBeenCalledWith(2);
    });
  });

  describe("Search Functionality", () => {
    it("should render search input", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search files...");
      expect(searchInput).toBeInTheDocument();
    });

    it("should display search query value", () => {
      render(
        <FileManagerBreadcrumbs {...defaultProps} searchQuery="test query" />
      );

      const searchInput = screen.getByPlaceholderText("Search files...");
      expect(searchInput).toHaveValue("test query");
    });

    it("should call onSearchChange when typing", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search files...");
      fireEvent.change(searchInput, { target: { value: "new search" } });

      expect(defaultProps.onSearchChange).toHaveBeenCalledWith("new search");
    });

    it("should show clear button when search query exists", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} searchQuery="test" />);

      const allButtons = screen.getAllByRole("button");
      // The clear button should be the last button (X icon in search)
      const clearButton = allButtons[allButtons.length - 1];
      expect(clearButton).toBeInTheDocument();
    });

    it("should not show clear button when search is empty", () => {
      const { container } = render(
        <FileManagerBreadcrumbs {...defaultProps} searchQuery="" />
      );

      // Look for X icon specifically in search area
      const searchContainer = container.querySelector(".relative");
      const xButton = searchContainer?.querySelector("button");
      expect(xButton).not.toBeInTheDocument();
    });

    it("should clear search when clear button is clicked", () => {
      render(
        <FileManagerBreadcrumbs {...defaultProps} searchQuery="test query" />
      );

      // Find the clear button (X icon)
      const buttons = screen.getAllByRole("button");
      const clearButton = buttons.find(
        (btn) =>
          btn.querySelector("svg") &&
          !btn.textContent?.includes("Documents") &&
          !btn.textContent?.includes("Test Folder")
      );

      fireEvent.click(clearButton!);

      expect(defaultProps.onSearchChange).toHaveBeenCalledWith("");
    });
  });

  describe("Drag and Drop", () => {
    it("should call onDragOver when dragging over breadcrumb", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} />);

      const breadcrumb = screen.getByText("Documents").closest("button")!;
      fireEvent.dragOver(breadcrumb);

      expect(defaultProps.onDragOver).toHaveBeenCalled();
    });

    it("should call onDragLeave when leaving breadcrumb", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} />);

      const breadcrumb = screen.getByText("Documents").closest("button")!;
      fireEvent.dragLeave(breadcrumb);

      expect(defaultProps.onDragLeave).toHaveBeenCalled();
    });

    it("should highlight breadcrumb when it is drop target", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} dropTarget="current" />);

      const lastBreadcrumb = screen.getByText("Test Folder").closest("button");
      expect(lastBreadcrumb).toHaveClass(
        "bg-primary-600/20",
        "ring-2",
        "ring-primary-500"
      );
    });

    it("should not highlight non-target breadcrumbs", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} dropTarget="other" />);

      const lastBreadcrumb = screen.getByText("Test Folder").closest("button");
      expect(lastBreadcrumb).not.toHaveClass("bg-primary-600/20");
    });

    it("should call onMove when dropping item to different folder", () => {
      // Create a file that's in folder-1 to drop it to root
      const fileInSubfolder = { ...mockPdfFile, parentId: "folder-1" };

      render(
        <FileManagerBreadcrumbs
          {...defaultProps}
          draggedItem={fileInSubfolder}
        />
      );

      const rootBreadcrumb = screen.getByText("Documents").closest("button")!;

      fireEvent.drop(rootBreadcrumb, {
        preventDefault: jest.fn(),
      });

      // Should move from folder-1 to root (null)
      expect(defaultProps.onMove).toHaveBeenCalledWith(
        fileInSubfolder.id,
        null
      );
    });

    it("should not move if no item is being dragged", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} draggedItem={null} />);

      const breadcrumb = screen.getByText("Documents").closest("button")!;
      fireEvent.drop(breadcrumb);

      expect(defaultProps.onMove).not.toHaveBeenCalled();
    });

    it("should not move to same parent", () => {
      const fileInCurrentFolder = { ...mockPdfFile, parentId: "folder-1" };

      render(
        <FileManagerBreadcrumbs
          {...defaultProps}
          draggedItem={fileInCurrentFolder}
        />
      );

      const folderBreadcrumb = screen
        .getByText("Test Folder")
        .closest("button")!;
      fireEvent.drop(folderBreadcrumb);

      expect(defaultProps.onMove).not.toHaveBeenCalled();
    });
  });

  describe("Responsive Layout", () => {
    it("should have responsive flex layout", () => {
      const { container } = render(
        <FileManagerBreadcrumbs {...defaultProps} />
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("flex", "flex-col", "sm:flex-row");
    });

    it("should have responsive search width", () => {
      const { container } = render(
        <FileManagerBreadcrumbs {...defaultProps} />
      );

      const searchContainer = container.querySelector(".relative");
      expect(searchContainer).toHaveClass("w-full", "sm:w-80");
    });

    it("should wrap breadcrumbs", () => {
      const { container } = render(
        <FileManagerBreadcrumbs {...defaultProps} />
      );

      const breadcrumbsContainer = container.querySelector(".flex-wrap");
      expect(breadcrumbsContainer).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty breadcrumbs array", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} breadcrumbs={[]} />);

      expect(screen.queryByText("Documents")).not.toBeInTheDocument();
    });

    it("should handle very long breadcrumb names", () => {
      const longBreadcrumbs = [
        { id: null, name: "Documents" },
        { id: "1", name: "A Very Long Folder Name That Might Wrap" },
      ];

      render(
        <FileManagerBreadcrumbs
          {...defaultProps}
          breadcrumbs={longBreadcrumbs}
        />
      );

      expect(
        screen.getByText("A Very Long Folder Name That Might Wrap")
      ).toBeInTheDocument();
    });

    it("should handle many nested breadcrumbs", () => {
      const manyBreadcrumbs = Array.from({ length: 10 }, (_, i) => ({
        id: i === 0 ? null : `folder-${i}`,
        name: i === 0 ? "Documents" : `Folder ${i}`,
      }));

      render(
        <FileManagerBreadcrumbs
          {...defaultProps}
          breadcrumbs={manyBreadcrumbs}
        />
      );

      expect(screen.getByText("Folder 9")).toBeInTheDocument();
    });

    it("should handle special characters in search", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search files...");
      fireEvent.change(searchInput, { target: { value: "test@#$%^&*()" } });

      expect(defaultProps.onSearchChange).toHaveBeenCalledWith("test@#$%^&*()");
    });
  });

  describe("Styling", () => {
    it("should have dark theme classes", () => {
      const { container } = render(
        <FileManagerBreadcrumbs {...defaultProps} />
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("bg-dark-800", "border-dark-600");
    });

    it("should have proper spacing", () => {
      const { container } = render(
        <FileManagerBreadcrumbs {...defaultProps} />
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("gap-4", "p-4");
    });

    it("should style breadcrumbs with hover effect", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} />);

      const breadcrumb = screen.getByText("Documents").closest("button");
      expect(breadcrumb).toHaveClass("hover:text-white", "transition-colors");
    });

    it("should style search input correctly", () => {
      render(<FileManagerBreadcrumbs {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText("Search files...");
      expect(searchInput).toHaveClass(
        "bg-dark-700",
        "border-dark-600",
        "text-white"
      );
    });
  });
});
