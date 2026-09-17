/**
 * Tests for FileActionsMenu component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileActionsMenu from "@/app/components/features/documents/FileActionsMenu";
import { mockPdfFile, mockFolder, mockImageFile } from "../../../utils/mock-documents";

describe("FileActionsMenu", () => {
  const defaultProps = {
    document: mockPdfFile,
    onRename: jest.fn(),
    onCopy: jest.fn(),
    onMove: jest.fn(),
    onDelete: jest.fn(),
    onDetails: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 844,
    });
  });

  describe("Rendering", () => {
    it("should render menu button", () => {
      render(<FileActionsMenu {...defaultProps} />);
      const button = screen.getByRole("button", { name: /more actions/i });
      expect(button).toBeInTheDocument();
    });

    it("should not show menu initially", () => {
      render(<FileActionsMenu {...defaultProps} />);
      expect(screen.queryByText("Preview")).not.toBeInTheDocument();
      expect(screen.queryByText("Download")).not.toBeInTheDocument();
    });

    it("should show menu when button is clicked", async () => {
      render(<FileActionsMenu {...defaultProps} onPreview={jest.fn()} />);
      const button = screen.getByRole("button", { name: /more actions/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Preview")).toBeInTheDocument();
      });
    });
  });

  describe("Menu Items for Files", () => {
    it("should show preview option for files with onPreview", async () => {
      const onPreview = jest.fn();
      render(<FileActionsMenu {...defaultProps} onPreview={onPreview} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.getByText("Preview")).toBeInTheDocument();
      });
    });

    it("should show download option for files with onDownload", async () => {
      const onDownload = jest.fn();
      render(<FileActionsMenu {...defaultProps} onDownload={onDownload} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.getByText("Download")).toBeInTheDocument();
      });
    });

    it("should always show information option", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.getByText("Information")).toBeInTheDocument();
      });
    });

    it("should show rename option", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.getByText("Rename")).toBeInTheDocument();
      });
    });

    it("should show copy option", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.getByText("Copy")).toBeInTheDocument();
      });
    });

    it("should show move option", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.getByText("Move")).toBeInTheDocument();
      });
    });

    it("should show delete option", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });
    });
  });

  describe("Menu Items for Folders", () => {
    const folderProps = {
      ...defaultProps,
      document: mockFolder,
    };

    it("should not show preview option for folders", async () => {
      render(<FileActionsMenu {...folderProps} onPreview={jest.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.queryByText("Preview")).not.toBeInTheDocument();
      });
    });

    it("should not show download option for folders", async () => {
      render(<FileActionsMenu {...folderProps} onDownload={jest.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.queryByText("Download")).not.toBeInTheDocument();
      });
    });

    it("should show navigate inside option for folders with onNavigate", async () => {
      const onNavigate = jest.fn();
      render(<FileActionsMenu {...folderProps} onNavigate={onNavigate} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.getByText("Navigate inside")).toBeInTheDocument();
      });
    });

    it("should not show navigate inside option for files", async () => {
      const onNavigate = jest.fn();
      render(<FileActionsMenu {...defaultProps} onNavigate={onNavigate} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.queryByText("Navigate inside")).not.toBeInTheDocument();
      });
    });

    it("should show rename, copy, move, delete for folders", async () => {
      render(<FileActionsMenu {...folderProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.getByText("Information")).toBeInTheDocument();
        expect(screen.getByText("Rename")).toBeInTheDocument();
        expect(screen.getByText("Copy")).toBeInTheDocument();
        expect(screen.getByText("Move")).toBeInTheDocument();
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });
    });
  });

  describe("Action Handlers", () => {
    it("should call onPreview when preview is clicked", async () => {
      const onPreview = jest.fn();
      render(<FileActionsMenu {...defaultProps} onPreview={onPreview} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        const previewButton = screen.getByText("Preview");
        fireEvent.click(previewButton);
      });

      expect(onPreview).toHaveBeenCalledWith(mockPdfFile);
      expect(onPreview).toHaveBeenCalledTimes(1);
    });

    it("should call onDownload when download is clicked", async () => {
      const onDownload = jest.fn();
      render(<FileActionsMenu {...defaultProps} onDownload={onDownload} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        const downloadButton = screen.getByText("Download");
        fireEvent.click(downloadButton);
      });

      expect(onDownload).toHaveBeenCalledWith(mockPdfFile);
    });

    it("should call onNavigate when navigate inside is clicked", async () => {
      const onNavigate = jest.fn();
      const folderProps = {
        ...defaultProps,
        document: mockFolder,
      };
      render(<FileActionsMenu {...folderProps} onNavigate={onNavigate} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        const navigateButton = screen.getByText("Navigate inside");
        fireEvent.click(navigateButton);
      });

      expect(onNavigate).toHaveBeenCalledWith(mockFolder);
      expect(onNavigate).toHaveBeenCalledTimes(1);
    });

    it("should call onDetails when information is clicked", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        const detailsButton = screen.getByText("Information");
        fireEvent.click(detailsButton);
      });

      expect(defaultProps.onDetails).toHaveBeenCalledWith(mockPdfFile);
    });

    it("should call onRename when rename is clicked", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        const renameButton = screen.getByText("Rename");
        fireEvent.click(renameButton);
      });

      expect(defaultProps.onRename).toHaveBeenCalledWith(mockPdfFile);
    });

    it("should call onCopy when copy is clicked", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        const copyButton = screen.getByText("Copy");
        fireEvent.click(copyButton);
      });

      expect(defaultProps.onCopy).toHaveBeenCalledWith(mockPdfFile);
    });

    it("should call onMove when move is clicked", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        const moveButton = screen.getByText("Move");
        fireEvent.click(moveButton);
      });

      expect(defaultProps.onMove).toHaveBeenCalledWith(mockPdfFile);
    });

    it("should call onDelete when delete is clicked", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        const deleteButton = screen.getByText("Delete");
        fireEvent.click(deleteButton);
      });

      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockPdfFile);
    });
  });

  describe("Menu Behavior", () => {
    it("should close menu after clicking an action", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      const button = screen.getByRole("button", { name: /more actions/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Rename")).toBeInTheDocument();
      });

      const renameButton = screen.getByText("Rename");
      fireEvent.click(renameButton);

      await waitFor(() => {
        expect(screen.queryByText("Rename")).not.toBeInTheDocument();
      });
    });

    it("should close menu when clicking outside", async () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <FileActionsMenu {...defaultProps} />
        </div>
      );

      const button = screen.getByRole("button", { name: /more actions/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Rename")).toBeInTheDocument();
      });

      const outside = screen.getByTestId("outside");
      fireEvent.mouseDown(outside);

      await waitFor(() => {
        expect(screen.queryByText("Rename")).not.toBeInTheDocument();
      });
    });

    it("should toggle menu open/close on button click", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      const button = screen.getByRole("button", { name: /more actions/i });

      // Open menu
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText("Rename")).toBeInTheDocument();
      });

      // Close menu
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.queryByText("Rename")).not.toBeInTheDocument();
      });
    });

    it("should prevent event propagation when menu button is clicked", () => {
      const onParentClick = jest.fn();
      render(
        <div onClick={onParentClick}>
          <FileActionsMenu {...defaultProps} />
        </div>
      );

      const button = screen.getByRole("button", { name: /more actions/i });
      fireEvent.click(button);

      expect(onParentClick).not.toHaveBeenCalled();
    });

    it("should prevent event propagation when menu item is clicked", async () => {
      const onParentClick = jest.fn();
      render(
        <div onClick={onParentClick}>
          <FileActionsMenu {...defaultProps} />
        </div>
      );

      const button = screen.getByRole("button", { name: /more actions/i });
      fireEvent.click(button);

      await waitFor(() => {
        const renameButton = screen.getByText("Rename");
        fireEvent.click(renameButton);
      });

      expect(onParentClick).not.toHaveBeenCalled();
    });

    it("should reposition the menu upward when opened near the bottom of the viewport", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      const button = screen.getByRole("button", { name: /more actions/i });
      const wrapper = button.parentElement;

      expect(wrapper).not.toBeNull();

      wrapper!.getBoundingClientRect = jest.fn(() => ({
        x: 320,
        y: 760,
        width: 32,
        height: 32,
        top: 760,
        right: 352,
        bottom: 792,
        left: 320,
        toJSON: () => ({}),
      }));

      fireEvent.click(button);

      const menu = await screen.findByRole("menu", {
        name: `Actions for ${mockPdfFile.name}`,
      });

      await waitFor(() => {
        expect(menu.style.bottom).toBe("88px");
        expect(menu.style.top).toBe("");
        expect(menu.style.maxHeight).toBe("736px");
      });
    });

    it("should open to the right of the trigger when that side has more space", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      const button = screen.getByRole("button", { name: /more actions/i });
      const wrapper = button.parentElement;

      expect(wrapper).not.toBeNull();

      wrapper!.getBoundingClientRect = jest.fn(() => ({
        x: 16,
        y: 120,
        width: 32,
        height: 32,
        top: 120,
        right: 48,
        bottom: 152,
        left: 16,
        toJSON: () => ({}),
      }));

      fireEvent.click(button);

      const menu = await screen.findByRole("menu", {
        name: `Actions for ${mockPdfFile.name}`,
      });

      await waitFor(() => {
        expect(menu.style.left).toBe("16px");
        expect(menu.style.top).toBe("156px");
      });
    });

    it("should clamp horizontally when neither side has enough space", async () => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: 180,
      });

      render(<FileActionsMenu {...defaultProps} />);

      const button = screen.getByRole("button", { name: /more actions/i });
      const wrapper = button.parentElement;

      expect(wrapper).not.toBeNull();

      wrapper!.getBoundingClientRect = jest.fn(() => ({
        x: 70,
        y: 120,
        width: 32,
        height: 32,
        top: 120,
        right: 102,
        bottom: 152,
        left: 70,
        toJSON: () => ({}),
      }));

      fireEvent.click(button);

      const menu = await screen.findByRole("menu", {
        name: `Actions for ${mockPdfFile.name}`,
      });

      await waitFor(() => {
        expect(menu.style.left).toBe("12px");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing onPreview prop", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.queryByText("Preview")).not.toBeInTheDocument();
      });
    });

    it("should handle missing onDownload prop", async () => {
      render(<FileActionsMenu {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.queryByText("Download")).not.toBeInTheDocument();
      });
    });

    it("should work with different document types", async () => {
      const { rerender } = render(<FileActionsMenu {...defaultProps} document={mockImageFile} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.getByText("Rename")).toBeInTheDocument();
      });

      // Change document
      rerender(<FileActionsMenu {...defaultProps} document={mockFolder} />);

      // Menu should still work
      expect(screen.getByRole("button", { name: /more actions/i })).toBeInTheDocument();
    });
  });

  describe("Parent Folder Menu", () => {
    const parentFolder = {
      id: "parent-folder",
      name: "..",
      isFolder: true,
      size: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      mimeType: "",
      parentId: null,
    };

    it("should show only navigate option for parent folder", async () => {
      const onNavigate = jest.fn();
      render(<FileActionsMenu document={parentFolder} onNavigate={onNavigate} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        expect(screen.getByText("Navigate up")).toBeInTheDocument();
      });

      // Should not show other options
      expect(screen.queryByText("Information")).not.toBeInTheDocument();
      expect(screen.queryByText("Rename")).not.toBeInTheDocument();
      expect(screen.queryByText("Copy")).not.toBeInTheDocument();
      expect(screen.queryByText("Move")).not.toBeInTheDocument();
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });

    it("should call onNavigate when navigate up is clicked for parent folder", async () => {
      const onNavigate = jest.fn();
      render(<FileActionsMenu document={parentFolder} onNavigate={onNavigate} />);

      fireEvent.click(screen.getByRole("button", { name: /more actions/i }));

      await waitFor(() => {
        const navigateButton = screen.getByText("Navigate up");
        fireEvent.click(navigateButton);
      });

      expect(onNavigate).toHaveBeenCalledWith(parentFolder);
      expect(onNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should have accessible button", () => {
      render(<FileActionsMenu {...defaultProps} />);
      const button = screen.getByRole("button", { name: /more actions/i });
      expect(button).toHaveAttribute("title", "More actions");
    });

    it("should be keyboard accessible", async () => {
      const user = userEvent.setup();
      render(<FileActionsMenu {...defaultProps} />);

      const button = screen.getByRole("button", { name: /more actions/i });

      // Focus and activate button
      await user.tab();
      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Rename")).toBeInTheDocument();
      });
    });
  });
});
