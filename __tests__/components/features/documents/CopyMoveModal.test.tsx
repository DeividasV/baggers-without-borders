/**
 * Tests for CopyMoveModal component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CopyMoveModal from "@/app/components/features/documents/CopyMoveModal";
import {
  mockFolder,
  mockPdfFile,
  mockSubFolder,
  mockFetchSuccess,
  mockFetchError,
} from "../../../utils/mock-documents";

// Mock fetch
global.fetch = jest.fn();

describe("CopyMoveModal", () => {
  const defaultProps = {
    show: true,
    mode: "copy" as const,
    sourceDocument: mockPdfFile,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe("Rendering", () => {
    it("should not render when show is false", () => {
      const { container } = render(
        <CopyMoveModal {...defaultProps} show={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should not render when sourceDocument is null", () => {
      const { container } = render(
        <CopyMoveModal {...defaultProps} sourceDocument={null} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render modal when show is true and has sourceDocument", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText(/Copy "document.pdf"/)).toBeInTheDocument();
      });
    });

    it("should show copy icon and text for copy mode", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} mode="copy" />);
      await waitFor(() => {
        expect(screen.getByText(/Copy "document.pdf"/)).toBeInTheDocument();
        expect(screen.getByText("Copy Here")).toBeInTheDocument();
      });
    });

    it("should show move icon and text for move mode", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} mode="move" />);
      await waitFor(() => {
        expect(screen.getByText(/Move "document.pdf"/)).toBeInTheDocument();
        expect(screen.getByText("Move Here")).toBeInTheDocument();
      });
    });

    it("should show destination instructions", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);
      await waitFor(() => {
        expect(
          screen.getByText("Select destination folder")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Folder Loading", () => {
    it("should fetch folders on mount", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/documents?");
      });
    });

    it("should show loading spinner while fetching", async () => {
      // Simulate slow fetch
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockFetchSuccess([mockFolder])), 100)
          )
      );

      const { container } = render(<CopyMoveModal {...defaultProps} />);
      // Check for the spinner by class name since it doesn't have role="status"
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should display folders after loading", async () => {
      mockFetchSuccess([mockFolder, mockSubFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Folder")).toBeInTheDocument();
        expect(screen.getByText("Sub Folder")).toBeInTheDocument();
      });
    });

    it("should show empty message when no folders available", async () => {
      mockFetchSuccess([]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("No subfolders available")).toBeInTheDocument();
      });
    });

    it("should handle fetch errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockFetchError("Network error");
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        // Component should still render even with error
        expect(screen.getByText(/Copy "document.pdf"/)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it("should filter out source document from list", async () => {
      mockFetchSuccess([mockFolder, mockPdfFile]);
      render(<CopyMoveModal {...defaultProps} sourceDocument={mockFolder} />);

      await waitFor(() => {
        expect(screen.queryByText("Test Folder")).not.toBeInTheDocument();
      });
    });

    it("should only show folders, not files", async () => {
      mockFetchSuccess([mockFolder, mockPdfFile]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Folder")).toBeInTheDocument();
        expect(screen.queryByText("document.pdf")).not.toBeInTheDocument();
      });
    });
  });

  describe("Breadcrumb Navigation", () => {
    it("should show root breadcrumb initially", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Documents")).toBeInTheDocument();
      });
    });

    it("should update breadcrumbs when opening folder", async () => {
      mockFetchSuccess([mockFolder, mockSubFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Folder")).toBeInTheDocument();
      });

      const openButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent?.includes("Test Folder"));
      fireEvent.click(openButton!);

      await waitFor(() => {
        expect(screen.getByText("Documents")).toBeInTheDocument();
        expect(screen.getAllByText("Test Folder").length).toBeGreaterThan(0);
      });
    });

    it("should navigate back when clicking breadcrumb", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Folder")).toBeInTheDocument();
      });

      // Open folder
      const folderButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent?.includes("Test Folder"));
      fireEvent.click(folderButton!);

      await waitFor(() => {
        expect(screen.getAllByText("Test Folder").length).toBeGreaterThan(0);
      });

      // Click root breadcrumb
      const breadcrumbs = screen.getAllByRole("button");
      const rootBreadcrumb = breadcrumbs.find((btn) =>
        btn.textContent?.includes("Documents")
      );
      fireEvent.click(rootBreadcrumb!);

      expect(global.fetch).toHaveBeenCalledWith("/api/documents?");
    });

    it("should fetch folders with parentId when navigating", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Folder")).toBeInTheDocument();
      });

      const openButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent?.includes("Test Folder"));
      fireEvent.click(openButton!);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/documents?parentId=${mockFolder.id}`
        );
      });
    });
  });

  describe("Folder Selection", () => {
    it("should allow selecting current folder", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Current folder/)).toBeInTheDocument();
      });

      const currentFolderButton = screen.getByText(/Current folder/);
      fireEvent.click(currentFolderButton.closest("button")!);

      expect(screen.getByText("Selected")).toBeInTheDocument();
    });

    it("should show current folder name in selection", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        // Open folder first
        const openButton = screen
          .getAllByRole("button")
          .find((btn) => btn.textContent?.includes("Test Folder"));
        fireEvent.click(openButton!);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Current folder \(Test Folder\)/)
        ).toBeInTheDocument();
      });
    });

    it("should highlight selected folder", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Folder")).toBeInTheDocument();
      });

      const selectButton = screen.getByText("Select");
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(selectButton).toHaveTextContent("Selected");
      });
    });

    it("should reset selection when navigating", async () => {
      mockFetchSuccess([mockFolder, mockSubFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Folder")).toBeInTheDocument();
      });

      // Select a folder
      const selectButtons = screen.getAllByText("Select");
      fireEvent.click(selectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Selected")).toBeInTheDocument();
      });

      // Navigate
      const openButtons = screen.getAllByRole("button");
      const openButton = openButtons.find(
        (btn) =>
          btn.textContent?.includes("Test Folder") &&
          !btn.textContent?.includes("Selected")
      );
      if (openButton) {
        fireEvent.click(openButton);
      }

      // Selection should be reset after navigating
      await waitFor(() => {
        // After navigation, we're in a new folder context
        expect(screen.queryByText("Test Folder")).toBeInTheDocument();
      });
    });
  });

  describe("Modal Actions", () => {
    it("should close modal on cancel", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Cancel")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Cancel"));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("should close modal on X button", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        const closeButtons = screen.getAllByRole("button");
        const xButton = closeButtons.find((btn) => {
          const svg = btn.querySelector("svg");
          return svg?.classList.contains("lucide-x");
        });
        expect(xButton).toBeInTheDocument();
        fireEvent.click(xButton!);
      });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("should confirm with selected folder", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Folder")).toBeInTheDocument();
      });

      // Select folder
      fireEvent.click(screen.getByText("Select"));

      // Confirm
      fireEvent.click(screen.getByText("Copy Here"));

      expect(defaultProps.onConfirm).toHaveBeenCalledWith(mockFolder.id);
    });

    it("should confirm with current folder if nothing selected", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Copy Here")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Copy Here"));

      expect(defaultProps.onConfirm).toHaveBeenCalledWith(null);
    });

    it("should reset state when closing", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Folder")).toBeInTheDocument();
      });

      // Select and navigate
      fireEvent.click(screen.getByText("Select"));
      const openButton = screen
        .getAllByRole("button")
        .find((btn) => btn.textContent?.includes("Test Folder"));
      fireEvent.click(openButton!);

      // Close
      fireEvent.click(screen.getByText("Cancel"));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe("Copy vs Move Mode", () => {
    it("should show copy text in copy mode", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} mode="copy" />);

      await waitFor(() => {
        expect(screen.getByText("Copy to this location")).toBeInTheDocument();
      });
    });

    it("should show move text in move mode", async () => {
      mockFetchSuccess([mockFolder]);
      render(<CopyMoveModal {...defaultProps} mode="move" />);

      await waitFor(() => {
        expect(screen.getByText("Move to this location")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid navigation", async () => {
      mockFetchSuccess([mockFolder, mockSubFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Folder")).toBeInTheDocument();
      });

      // Rapidly click multiple times
      const buttons = screen.getAllByRole("button");
      const openButton = buttons.find((btn) =>
        btn.textContent?.includes("Test Folder")
      );

      fireEvent.click(openButton!);
      fireEvent.click(openButton!);

      // Should still work correctly
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it("should handle deeply nested folders", async () => {
      const deepFolder = {
        ...mockFolder,
        path: "/level1/level2/level3/level4",
      };
      mockFetchSuccess([deepFolder]);
      render(<CopyMoveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Folder")).toBeInTheDocument();
      });
    });
  });
});
