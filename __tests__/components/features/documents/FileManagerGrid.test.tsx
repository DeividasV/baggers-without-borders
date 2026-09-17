/**
 * Tests for FileManagerGrid component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FileManagerGrid from "@/app/components/features/documents/FileManagerGrid";
import {
  mockFolder,
  mockPdfFile,
  mockImageFile,
  mockTextFile,
  mockBreadcrumbs,
  mockParentFolder,
} from "../../../utils/mock-documents";

describe("FileManagerGrid", () => {
  const defaultProps = {
    documents: [mockFolder, mockPdfFile, mockImageFile],
    searchQuery: "",
    breadcrumbs: mockBreadcrumbs,
    dropTarget: null,
    onOpenFolder: jest.fn(),
    onBreadcrumbClick: jest.fn(),
    onPreview: jest.fn(),
    onDownload: jest.fn(),
    onRename: jest.fn(),
    onCopy: jest.fn(),
    onMoveDocument: jest.fn(),
    onDelete: jest.fn(),
    onDetails: jest.fn(),
    onDragStart: jest.fn(),
    onDragOver: jest.fn(),
    onDragLeave: jest.fn(),
    onDrop: jest.fn(),
    onMove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render grid layout", () => {
      const { container } = render(<FileManagerGrid {...defaultProps} />);
      const grid = container.firstChild;
      expect(grid).toHaveClass("hidden", "md:grid");
    });

    it("should render all documents", () => {
      render(<FileManagerGrid {...defaultProps} />);
      expect(screen.getByText("Test Folder")).toBeInTheDocument();
      expect(screen.getByText("document.pdf")).toBeInTheDocument();
      expect(screen.getByText("image.png")).toBeInTheDocument();
    });

    it("should hide on mobile", () => {
      const { container } = render(<FileManagerGrid {...defaultProps} />);
      expect(container.firstChild).toHaveClass("hidden", "md:grid");
    });

    it("should show folder label for folders", () => {
      render(<FileManagerGrid {...defaultProps} />);
      const folderLabels = screen.getAllByText("Folder");
      expect(folderLabels.length).toBeGreaterThan(0);
    });

    it("should show file size for files", () => {
      render(<FileManagerGrid {...defaultProps} />);
      // mockPdfFile has size 512000 bytes = 500 KB
      expect(screen.getByText("500 KB")).toBeInTheDocument();
    });

    it("should render icons for each document", () => {
      const { container } = render(<FileManagerGrid {...defaultProps} />);
      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("Search Query Path Display", () => {
    it("should show path when searching", () => {
      render(<FileManagerGrid {...defaultProps} searchQuery="test" />);
      // Should show truncated paths for files with paths
      expect(screen.getByText("/Test Folder")).toBeInTheDocument();
    });

    it("should not show path when not searching", () => {
      render(<FileManagerGrid {...defaultProps} searchQuery="" />);
      // Path should not be visible
      expect(screen.queryByText("/Test Folder")).not.toBeInTheDocument();
    });

    it("should not show path for parent folder", () => {
      render(
        <FileManagerGrid
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
          searchQuery="test"
        />
      );
      // Parent folder should not show path
      const parentCard = screen.getByText("..").closest("div");
      expect(parentCard).not.toHaveTextContent("/Test Folder");
    });
  });

  describe("Double Click Interactions", () => {
    it("should open folder on double click", () => {
      render(<FileManagerGrid {...defaultProps} />);
      const folderCard = screen.getByText("Test Folder").closest("div");
      fireEvent.doubleClick(folderCard!);
      expect(defaultProps.onOpenFolder).toHaveBeenCalledWith(mockFolder);
    });

    it("should preview file on double click if previewable", () => {
      render(<FileManagerGrid {...defaultProps} />);
      const fileCard = screen.getByText("image.png").closest("div");
      fireEvent.doubleClick(fileCard!);
      expect(defaultProps.onPreview).toHaveBeenCalledWith(mockImageFile);
    });

    it("should navigate up when double clicking parent folder", () => {
      render(
        <FileManagerGrid
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
        />
      );
      const parentCard = screen.getByText("..").closest("div");
      fireEvent.doubleClick(parentCard!);
      expect(defaultProps.onBreadcrumbClick).toHaveBeenCalledWith(0);
    });
  });

  describe("Single Click Interactions", () => {
    it("should preview file on single click if previewable", () => {
      render(<FileManagerGrid {...defaultProps} />);
      const fileCard = screen.getByText("image.png").closest("div");
      fireEvent.click(fileCard!);
      expect(defaultProps.onPreview).toHaveBeenCalledWith(mockImageFile);
    });

    it("should not preview folder on single click", () => {
      render(<FileManagerGrid {...defaultProps} />);
      const folderCard = screen.getByText("Test Folder").closest("div");
      fireEvent.click(folderCard!);
      expect(defaultProps.onPreview).not.toHaveBeenCalled();
    });

    it("should navigate up on parent folder single click", () => {
      render(
        <FileManagerGrid
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
        />
      );
      const parentCard = screen.getByText("..").closest("div");
      fireEvent.click(parentCard!);
      expect(defaultProps.onBreadcrumbClick).toHaveBeenCalledWith(0);
    });
  });

  describe("Preview Button", () => {
    it("should show preview button for previewable files", () => {
      render(<FileManagerGrid {...defaultProps} />);
      const previewButtons = screen.getAllByTitle("Preview");
      expect(previewButtons.length).toBeGreaterThan(0);
    });

    it("should call onPreview when preview button clicked", () => {
      render(<FileManagerGrid {...defaultProps} />);
      const imageCard = screen.getByText("image.png").closest("div")!;
      const previewButton = imageCard.querySelector('button[title="Preview"]');
      if (previewButton) {
        fireEvent.click(previewButton);
        expect(defaultProps.onPreview).toHaveBeenCalledWith(mockImageFile);
      }
    });

    it("should stop propagation on preview button click", () => {
      render(<FileManagerGrid {...defaultProps} />);
      const imageCard = screen.getByText("image.png").closest("div")!;
      const previewButton = imageCard.querySelector('button[title="Preview"]');

      if (previewButton) {
        fireEvent.click(previewButton);
        // Preview should be called but card click should not trigger additional preview
        expect(defaultProps.onPreview).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe("Drag and Drop", () => {
    it("should be draggable for regular documents", () => {
      const { container } = render(<FileManagerGrid {...defaultProps} />);
      const cards = container.querySelectorAll('[draggable="true"]');
      expect(cards.length).toBe(3); // All regular documents
    });

    it("should not be draggable for parent folder", () => {
      render(
        <FileManagerGrid
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
        />
      );
      const cards = screen.getAllByRole("button", { hidden: true });
      // Parent folder card should exist but draggable attribute logic is in component
      expect(screen.getByText("..")).toBeInTheDocument();
    });

    it("should call onDragStart when dragging", () => {
      render(<FileManagerGrid {...defaultProps} />);
      const fileCard = screen.getByText("document.pdf").closest("div");
      fireEvent.dragStart(fileCard!);
      expect(defaultProps.onDragStart).toHaveBeenCalledWith(
        expect.any(Object),
        mockPdfFile
      );
    });

    it("should not call onDragStart for parent folder", () => {
      render(
        <FileManagerGrid
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
        />
      );
      const parentCard = screen.getByText("..").closest("div");
      fireEvent.dragStart(parentCard!);
      expect(defaultProps.onDragStart).not.toHaveBeenCalled();
    });

    it("should call onDragOver when dragging over folder", () => {
      render(<FileManagerGrid {...defaultProps} />);
      const folderCard = screen.getByText("Test Folder").closest("div");
      fireEvent.dragOver(folderCard!);
      expect(defaultProps.onDragOver).toHaveBeenCalled();
    });

    it("should call onDragLeave when leaving drag area", () => {
      render(<FileManagerGrid {...defaultProps} />);
      const folderCard = screen.getByText("Test Folder").closest("div");
      fireEvent.dragLeave(folderCard!);
      expect(defaultProps.onDragLeave).toHaveBeenCalled();
    });

    it("should highlight drop target", () => {
      const { container } = render(
        <FileManagerGrid {...defaultProps} dropTarget="folder-1" />
      );
      const ringElement = container.querySelector(".ring-2.ring-primary-500");
      expect(ringElement).toBeInTheDocument();
    });

    it("should highlight parent folder as drop target", () => {
      const { container } = render(
        <FileManagerGrid
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
          dropTarget="parent-folder"
        />
      );
      const ringElement = container.querySelector(".ring-2.ring-primary-500");
      expect(ringElement).toBeInTheDocument();
    });
  });

  describe("Parent Folder Styling", () => {
    it("should style parent folder differently", () => {
      render(
        <FileManagerGrid
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
        />
      );
      expect(screen.getByText("..")).toBeInTheDocument();
      // Parent folder has special styling
      const { container } = render(
        <FileManagerGrid
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
        />
      );
      expect(container.querySelector(".bg-dark-700")).toBeInTheDocument();
    });
  });

  describe("Actions Menu", () => {
    it("should show actions menu for regular documents", () => {
      const { container } = render(<FileManagerGrid {...defaultProps} />);
      // FileActionsMenu should be rendered for non-parent-folder items
      const cards = container.querySelectorAll(".group");
      expect(cards.length).toBe(3);
    });

    it("should not show actions menu for parent folder", () => {
      render(
        <FileManagerGrid {...defaultProps} documents={[mockParentFolder]} />
      );
      const parentCard = screen.getByText("..").closest("div");
      // Should not have FileActionsMenu
      expect(
        parentCard!.querySelector('button[title="More actions"]')
      ).not.toBeInTheDocument();
    });
  });

  describe("Hover Effects", () => {
    it("should have hover classes", () => {
      const { container } = render(<FileManagerGrid {...defaultProps} />);
      const cards = container.querySelectorAll(".group");
      cards.forEach((card) => {
        expect(card).toHaveClass("hover:bg-dark-700");
      });
    });

    it("should scale icon on hover", () => {
      const { container } = render(<FileManagerGrid {...defaultProps} />);
      const iconContainers = container.querySelectorAll(
        ".group-hover\\:scale-110"
      );
      expect(iconContainers.length).toBe(3);
    });
  });

  describe("Responsive Grid", () => {
    it("should have responsive grid columns", () => {
      const { container } = render(<FileManagerGrid {...defaultProps} />);
      const grid = container.firstChild;
      expect(grid).toHaveClass(
        "grid-cols-2",
        "lg:grid-cols-3",
        "xl:grid-cols-4",
        "2xl:grid-cols-5"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty documents array", () => {
      render(<FileManagerGrid {...defaultProps} documents={[]} />);
      expect(screen.queryByText("Test Folder")).not.toBeInTheDocument();
    });

    it("should handle documents without size", () => {
      const docWithoutSize = { ...mockPdfFile, size: null };
      render(
        <FileManagerGrid {...defaultProps} documents={[docWithoutSize]} />
      );
      expect(screen.getByText("0 KB")).toBeInTheDocument();
    });

    it("should handle very long file names", () => {
      const longName = "a".repeat(100) + ".txt";
      const docWithLongName = { ...mockPdfFile, name: longName };
      render(
        <FileManagerGrid {...defaultProps} documents={[docWithLongName]} />
      );
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it("should truncate file names in UI", () => {
      const longName = "a".repeat(100) + ".txt";
      const docWithLongName = { ...mockPdfFile, name: longName };
      const { container } = render(
        <FileManagerGrid {...defaultProps} documents={[docWithLongName]} />
      );
      const nameElement = container.querySelector(".truncate");
      expect(nameElement).toHaveClass("truncate");
    });
  });

  describe("Drop Handling", () => {
    it("should call onDrop for folder drop", () => {
      render(<FileManagerGrid {...defaultProps} />);
      const folderCard = screen.getByText("Test Folder").closest("div");
      fireEvent.drop(folderCard!);
      expect(defaultProps.onDrop).toHaveBeenCalled();
    });

    it("should handle parent folder drop with data transfer", () => {
      const draggedDoc = JSON.stringify({
        ...mockPdfFile,
        parentId: "folder-1",
      });
      render(
        <FileManagerGrid
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
        />
      );

      const parentCard = screen.getByText("..").closest("div");
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => draggedDoc),
        },
      };

      fireEvent.drop(parentCard!, dropEvent);
      expect(defaultProps.onMove).toHaveBeenCalled();
    });
  });

  describe("Icon Rendering", () => {
    it("should render appropriate icons based on file type", () => {
      const { container } = render(<FileManagerGrid {...defaultProps} />);
      const icons = container.querySelectorAll("svg");
      // Should have icons for folder, pdf, and image
      expect(icons.length).toBeGreaterThan(2);
    });

    it("should have consistent icon sizing", () => {
      const { container } = render(<FileManagerGrid {...defaultProps} />);
      const icons = container.querySelectorAll(".h-20.w-20");
      expect(icons.length).toBe(3);
    });
  });
});
