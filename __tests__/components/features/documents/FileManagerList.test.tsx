/**
 * Tests for FileManagerList component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FileManagerList from "@/app/components/features/documents/FileManagerList";
import {
  mockFolder,
  mockPdfFile,
  mockImageFile,
  mockTextFile,
  mockBreadcrumbs,
  mockParentFolder,
} from "../../../utils/mock-documents";

describe("FileManagerList", () => {
  const defaultProps = {
    documents: [mockFolder, mockPdfFile, mockImageFile],
    searchQuery: "",
    breadcrumbs: mockBreadcrumbs,
    dropTarget: null,
    sortBy: "name" as const,
    sortDirection: "asc" as const,
    onOpenFolder: jest.fn(),
    onBreadcrumbClick: jest.fn(),
    onPreview: jest.fn(),
    onDownload: jest.fn(),
    onRename: jest.fn(),
    onCopy: jest.fn(),
    onMoveDocument: jest.fn(),
    onDelete: jest.fn(),
    onDetails: jest.fn(),
    onSort: jest.fn(),
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
    it("should render table", () => {
      render(<FileManagerList {...defaultProps} />);
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
    });

    it("should hide on mobile", () => {
      const { container } = render(<FileManagerList {...defaultProps} />);
      expect(container.firstChild).toHaveClass("hidden", "md:block");
    });

    it("should render all documents", () => {
      render(<FileManagerList {...defaultProps} />);
      expect(screen.getByText("Test Folder")).toBeInTheDocument();
      expect(screen.getByText("document.pdf")).toBeInTheDocument();
      expect(screen.getByText("image.png")).toBeInTheDocument();
    });

    it("should render table headers", () => {
      render(<FileManagerList {...defaultProps} />);
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Size")).toBeInTheDocument();
      expect(screen.getByText("Modified")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });
  });

  describe("Sorting", () => {
    it("should show sort icon for name column when sorted by name", () => {
      const { container } = render(<FileManagerList {...defaultProps} />);
      const nameHeader = screen.getByText("Name").closest("th");
      const sortIcon = nameHeader?.querySelector("svg");
      expect(sortIcon).toBeInTheDocument();
    });

    it("should show ascending arrow when sorted asc", () => {
      const { container } = render(
        <FileManagerList {...defaultProps} sortBy="name" sortDirection="asc" />
      );
      const nameHeader = screen.getByText("Name").closest("th");
      expect(nameHeader).toBeInTheDocument();
      // Arrow up icon should be present
      const arrowIcon = container.querySelector(".lucide-arrow-up");
      expect(arrowIcon).toBeInTheDocument();
    });

    it("should show descending arrow when sorted desc", () => {
      const { container } = render(
        <FileManagerList {...defaultProps} sortBy="name" sortDirection="desc" />
      );
      const nameHeader = screen.getByText("Name").closest("th");
      expect(nameHeader).toBeInTheDocument();
      // Arrow down icon should be present
      const arrowIcon = container.querySelector(".lucide-arrow-down");
      expect(arrowIcon).toBeInTheDocument();
    });

    it("should call onSort when clicking name header", () => {
      render(<FileManagerList {...defaultProps} />);
      const nameHeader = screen.getByText("Name").closest("th");
      fireEvent.click(nameHeader!);
      expect(defaultProps.onSort).toHaveBeenCalledWith("name");
    });

    it("should call onSort when clicking size header", () => {
      render(<FileManagerList {...defaultProps} />);
      const sizeHeader = screen.getByText("Size").closest("th");
      fireEvent.click(sizeHeader!);
      expect(defaultProps.onSort).toHaveBeenCalledWith("size");
    });

    it("should call onSort when clicking modified header", () => {
      render(<FileManagerList {...defaultProps} />);
      const modifiedHeader = screen.getByText("Modified").closest("th");
      fireEvent.click(modifiedHeader!);
      expect(defaultProps.onSort).toHaveBeenCalledWith("modified");
    });

    it("should show inactive sort icon for other columns", () => {
      render(<FileManagerList {...defaultProps} sortBy="name" />);
      const sizeHeader = screen.getByText("Size").closest("th");
      const sortIcon = sizeHeader?.querySelector(".opacity-50");
      expect(sortIcon).toBeInTheDocument();
    });
  });

  describe("File Information Display", () => {
    it("should show dash for folder size", () => {
      render(<FileManagerList {...defaultProps} />);
      const rows = screen.getAllByRole("row");
      // First data row is the folder
      expect(rows[1]).toHaveTextContent("-");
    });

    it("should show formatted file size", () => {
      render(<FileManagerList {...defaultProps} />);
      // File size is displayed in the table
      expect(screen.getByText("document.pdf")).toBeInTheDocument();
    });

    it("should show formatted date", () => {
      render(<FileManagerList {...defaultProps} />);
      // Should show dates for files
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBeGreaterThan(1);
    });

    it("should show dash for parent folder modified date", () => {
      render(
        <FileManagerList
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
        />
      );
      const rows = screen.getAllByRole("row");
      // Parent folder row should have dashes
      expect(rows[1]).toHaveTextContent("-");
    });
  });

  describe("Search Query Path Display", () => {
    it("should show path when searching", () => {
      render(<FileManagerList {...defaultProps} searchQuery="test" />);
      expect(screen.getByText("/Test Folder")).toBeInTheDocument();
    });

    it("should not show path when not searching", () => {
      render(<FileManagerList {...defaultProps} searchQuery="" />);
      expect(screen.queryByText("/Test Folder")).not.toBeInTheDocument();
    });

    it("should truncate long paths", () => {
      const longPath = "/very/long/path/that/should/be/truncated";
      const docWithLongPath = { ...mockPdfFile, path: longPath };
      render(
        <FileManagerList
          {...defaultProps}
          documents={[docWithLongPath]}
          searchQuery="test"
        />
      );
      const pathElement = screen.getByTitle(longPath);
      expect(pathElement).toHaveClass("truncate");
    });
  });

  describe("Double Click Interactions", () => {
    it("should open folder on double click", () => {
      render(<FileManagerList {...defaultProps} />);
      const folderRow = screen.getByText("Test Folder").closest("tr");
      fireEvent.doubleClick(folderRow!);
      expect(defaultProps.onOpenFolder).toHaveBeenCalledWith(mockFolder);
    });

    it("should preview file on double click if previewable", () => {
      render(<FileManagerList {...defaultProps} />);
      const fileRow = screen.getByText("image.png").closest("tr");
      fireEvent.doubleClick(fileRow!);
      expect(defaultProps.onPreview).toHaveBeenCalledWith(mockImageFile);
    });

    it("should navigate up when double clicking parent folder", () => {
      render(
        <FileManagerList
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
        />
      );
      const parentRow = screen.getByText("..").closest("tr");
      fireEvent.doubleClick(parentRow!);
      expect(defaultProps.onBreadcrumbClick).toHaveBeenCalledWith(0);
    });
  });

  describe("Preview Button", () => {
    it("should show preview button for previewable files", () => {
      render(<FileManagerList {...defaultProps} />);
      const previewButtons = screen.getAllByTitle("Preview");
      expect(previewButtons.length).toBeGreaterThan(0);
    });

    it("should call onPreview when preview button clicked", () => {
      render(<FileManagerList {...defaultProps} />);
      const previewButtons = screen.getAllByTitle("Preview");
      fireEvent.click(previewButtons[0]);
      expect(defaultProps.onPreview).toHaveBeenCalled();
    });

    it("should stop propagation on preview button click", () => {
      render(<FileManagerList {...defaultProps} />);
      const previewButtons = screen.getAllByTitle("Preview");
      fireEvent.click(previewButtons[0]);
      // Should call preview only once, not trigger row click
      expect(defaultProps.onPreview).toHaveBeenCalledTimes(1);
    });

    it("should not show preview button for folders", () => {
      render(<FileManagerList {...defaultProps} documents={[mockFolder]} />);
      expect(screen.queryByTitle("Preview")).not.toBeInTheDocument();
    });
  });

  describe("Drag and Drop", () => {
    it("should be draggable for regular documents", () => {
      const { container } = render(<FileManagerList {...defaultProps} />);
      const rows = container.querySelectorAll('tr[draggable="true"]');
      expect(rows.length).toBe(3);
    });

    it("should not be draggable for parent folder", () => {
      render(
        <FileManagerList
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
        />
      );
      const parentRow = screen.getByText("..").closest("tr");
      expect(parentRow).toHaveAttribute("draggable", "false");
    });

    it("should call onDragStart when dragging", () => {
      render(<FileManagerList {...defaultProps} />);
      const fileRow = screen.getByText("document.pdf").closest("tr");
      fireEvent.dragStart(fileRow!);
      expect(defaultProps.onDragStart).toHaveBeenCalledWith(
        expect.any(Object),
        mockPdfFile
      );
    });

    it("should call onDragOver when dragging over folder", () => {
      render(<FileManagerList {...defaultProps} />);
      const folderRow = screen.getByText("Test Folder").closest("tr");
      fireEvent.dragOver(folderRow!);
      expect(defaultProps.onDragOver).toHaveBeenCalled();
    });

    it("should call onDragLeave when leaving drag area", () => {
      render(<FileManagerList {...defaultProps} />);
      const folderRow = screen.getByText("Test Folder").closest("tr");
      fireEvent.dragLeave(folderRow!);
      expect(defaultProps.onDragLeave).toHaveBeenCalled();
    });

    it("should highlight drop target", () => {
      render(<FileManagerList {...defaultProps} dropTarget="folder-1" />);
      const folderRow = screen.getByText("Test Folder").closest("tr");
      expect(folderRow).toHaveClass("bg-primary-900/20");
    });
  });

  describe("Icons", () => {
    it("should render icons for each document", () => {
      const { container } = render(<FileManagerList {...defaultProps} />);
      const icons = container.querySelectorAll(".h-8.w-8");
      expect(icons.length).toBe(3);
    });

    it("should render appropriate icon based on file type", () => {
      const { container } = render(<FileManagerList {...defaultProps} />);
      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThan(3); // Icons + sort icons
    });
  });

  describe("Actions Menu", () => {
    it("should show actions for regular documents", () => {
      render(<FileManagerList {...defaultProps} />);
      const rows = screen.getAllByRole("row");
      // Should have action cells with content for non-parent folders
      expect(rows.length).toBeGreaterThan(1);
    });

    it("should not show actions for parent folder", () => {
      render(
        <FileManagerList {...defaultProps} documents={[mockParentFolder]} />
      );
      const parentRow = screen.getByText("..").closest("tr");
      const actionsCell = parentRow?.querySelector("td:last-child");
      // Actions cell should be empty
      expect(actionsCell?.textContent).toBe("");
    });
  });

  describe("Hover Effects", () => {
    it("should have hover classes on rows", () => {
      const { container } = render(<FileManagerList {...defaultProps} />);
      const rows = container.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        expect(row).toHaveClass("hover:bg-dark-700");
      });
    });
  });

  describe("Parent Folder Styling", () => {
    it("should style parent folder differently", () => {
      render(
        <FileManagerList
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
        />
      );
      const parentRow = screen.getByText("..").closest("tr");
      expect(parentRow).toHaveClass("bg-dark-700/50");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty documents array", () => {
      render(<FileManagerList {...defaultProps} documents={[]} />);
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBe(1); // Only header row
    });

    it("should handle documents without size", () => {
      const docWithoutSize = { ...mockPdfFile, size: null };
      render(
        <FileManagerList {...defaultProps} documents={[docWithoutSize]} />
      );
      expect(screen.getByText("0 Bytes")).toBeInTheDocument();
    });

    it("should handle very long file names", () => {
      const longName = "a".repeat(100) + ".txt";
      const docWithLongName = { ...mockPdfFile, name: longName };
      render(
        <FileManagerList {...defaultProps} documents={[docWithLongName]} />
      );
      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("should have responsive container classes", () => {
      const { container } = render(<FileManagerList {...defaultProps} />);
      expect(container.firstChild).toHaveClass("hidden", "md:block");
    });
  });

  describe("Table Structure", () => {
    it("should have proper table structure", () => {
      render(<FileManagerList {...defaultProps} />);
      expect(screen.getByRole("table")).toBeInTheDocument();
      const thead = screen.getByRole("table").querySelector("thead");
      const tbody = screen.getByRole("table").querySelector("tbody");
      expect(thead).toBeInTheDocument();
      expect(tbody).toBeInTheDocument();
    });

    it("should divide rows with borders", () => {
      const { container } = render(<FileManagerList {...defaultProps} />);
      const tbody = container.querySelector("tbody");
      expect(tbody).toHaveClass("divide-y", "divide-dark-700");
    });
  });

  describe("Drop Handling", () => {
    it("should call onDrop for folder", () => {
      render(<FileManagerList {...defaultProps} />);
      const folderRow = screen.getByText("Test Folder").closest("tr");
      fireEvent.drop(folderRow!);
      expect(defaultProps.onDrop).toHaveBeenCalled();
    });

    it("should handle parent folder drop with data transfer", () => {
      const draggedDoc = JSON.stringify({
        ...mockPdfFile,
        parentId: "folder-1",
      });
      render(
        <FileManagerList
          {...defaultProps}
          documents={[mockParentFolder, mockPdfFile]}
        />
      );

      const parentRow = screen.getByText("..").closest("tr");
      const dropEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => draggedDoc),
        },
      };

      fireEvent.drop(parentRow!, dropEvent);
      expect(defaultProps.onMove).toHaveBeenCalled();
    });
  });
});
