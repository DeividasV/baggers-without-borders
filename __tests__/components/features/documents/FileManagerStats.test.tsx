import React from "react";
import { render, screen } from "@testing-library/react";
import FileManagerStats from "@/app/components/features/documents/FileManagerStats";
import type { Document } from "@/app/components/features/documents/types";

jest.mock("@/app/components/ui/StatsCard", () => {
  return function MockStatsCard({ icon: Icon, value, label }: any) {
    return (
      <div data-testid="stats-card">
        {Icon && (
          <Icon
            data-testid={`icon-${label.toLowerCase().replace(/\s+/g, "-")}`}
          />
        )}
        <div data-testid={`value-${label.toLowerCase().replace(/\s+/g, "-")}`}>
          {value}
        </div>
        <div data-testid={`label-${label.toLowerCase().replace(/\s+/g, "-")}`}>
          {label}
        </div>
      </div>
    );
  };
});

describe("FileManagerStats Component", () => {
  const mockFile1: Document = {
    id: "1",
    name: "file1.txt",
    isFolder: false,
    parentId: null,
    path: "/file1.txt",
    filename: "file1.txt",
    originalName: "file1.txt",
    mimeType: "text/plain",
    size: 1024,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const mockFile2: Document = {
    id: "2",
    name: "image.png",
    isFolder: false,
    parentId: null,
    path: "/image.png",
    filename: "image.png",
    originalName: "image.png",
    mimeType: "image/png",
    size: 2048,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const mockFolder: Document = {
    id: "3",
    name: "Documents",
    isFolder: true,
    parentId: null,
    path: "/Documents",
    filename: null,
    originalName: null,
    mimeType: null,
    size: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  describe("File Count Statistics", () => {
    it("should count only files, not folders", () => {
      render(
        <FileManagerStats documents={[mockFile1, mockFile2, mockFolder]} />
      );
      expect(screen.getByTestId("value-total-files")).toHaveTextContent("2");
    });

    it("should show zero files when no documents", () => {
      render(<FileManagerStats documents={[]} />);
      expect(screen.getByTestId("value-total-files")).toHaveTextContent("0");
    });

    it("should show zero files when only folders exist", () => {
      render(<FileManagerStats documents={[mockFolder]} />);
      expect(screen.getByTestId("value-total-files")).toHaveTextContent("0");
    });

    it("should count all files correctly", () => {
      const manyFiles = Array.from({ length: 10 }, (_, i) => ({
        ...mockFile1,
        id: `file-${i}`,
      }));
      render(<FileManagerStats documents={manyFiles} />);
      expect(screen.getByTestId("value-total-files")).toHaveTextContent("10");
    });
  });

  describe("Folder Count Statistics", () => {
    it("should count only folders, not files", () => {
      render(<FileManagerStats documents={[mockFile1, mockFolder]} />);
      expect(screen.getByTestId("value-folders")).toHaveTextContent("1");
    });

    it("should show zero folders when no documents", () => {
      render(<FileManagerStats documents={[]} />);
      expect(screen.getByTestId("value-folders")).toHaveTextContent("0");
    });

    it("should show zero folders when only files exist", () => {
      render(<FileManagerStats documents={[mockFile1, mockFile2]} />);
      expect(screen.getByTestId("value-folders")).toHaveTextContent("0");
    });

    it("should count all folders correctly", () => {
      const manyFolders = Array.from({ length: 5 }, (_, i) => ({
        ...mockFolder,
        id: `folder-${i}`,
      }));
      render(<FileManagerStats documents={manyFolders} />);
      expect(screen.getByTestId("value-folders")).toHaveTextContent("5");
    });
  });

  describe("Total Size Statistics", () => {
    it("should sum file sizes correctly", () => {
      render(<FileManagerStats documents={[mockFile1, mockFile2]} />);
      // 1024 + 2048 = 3072 bytes = 3 KB
      expect(screen.getByTestId("value-total-size")).toHaveTextContent("3 KB");
    });

    it("should show 0 Bytes when no documents", () => {
      render(<FileManagerStats documents={[]} />);
      expect(screen.getByTestId("value-total-size")).toHaveTextContent(
        "0 Bytes"
      );
    });

    it("should ignore folder sizes", () => {
      render(<FileManagerStats documents={[mockFile1, mockFolder]} />);
      expect(screen.getByTestId("value-total-size")).toHaveTextContent("1 KB");
    });

    it("should handle null sizes", () => {
      const fileWithNullSize = { ...mockFile1, size: null };
      render(<FileManagerStats documents={[fileWithNullSize]} />);
      expect(screen.getByTestId("value-total-size")).toHaveTextContent(
        "0 Bytes"
      );
    });

    it("should format large sizes in MB", () => {
      const largeFile = { ...mockFile1, size: 1048576 }; // 1 MB
      render(<FileManagerStats documents={[largeFile]} />);
      expect(screen.getByTestId("value-total-size")).toHaveTextContent("1 MB");
    });

    it("should format very large sizes in GB", () => {
      const veryLargeFile = { ...mockFile1, size: 1073741824 }; // 1 GB
      render(<FileManagerStats documents={[veryLargeFile]} />);
      expect(screen.getByTestId("value-total-size")).toHaveTextContent("1 GB");
    });
  });

  describe("StatsCard Integration", () => {
    it("should render three stats cards", () => {
      render(<FileManagerStats documents={[]} />);
      expect(screen.getAllByTestId("stats-card")).toHaveLength(3);
    });

    it("should render Total Files label", () => {
      render(<FileManagerStats documents={[]} />);
      expect(screen.getByTestId("label-total-files")).toHaveTextContent(
        "Total Files"
      );
    });

    it("should render Folders label", () => {
      render(<FileManagerStats documents={[]} />);
      expect(screen.getByTestId("label-folders")).toHaveTextContent("Folders");
    });

    it("should render Total Size label", () => {
      render(<FileManagerStats documents={[]} />);
      expect(screen.getByTestId("label-total-size")).toHaveTextContent(
        "Total Size"
      );
    });

    it("should render FileText icon", () => {
      render(<FileManagerStats documents={[]} />);
      expect(screen.getByTestId("icon-total-files")).toBeInTheDocument();
    });

    it("should render Folder icon", () => {
      render(<FileManagerStats documents={[]} />);
      expect(screen.getByTestId("icon-folders")).toBeInTheDocument();
    });

    it("should render HardDrive icon", () => {
      render(<FileManagerStats documents={[]} />);
      expect(screen.getByTestId("icon-total-size")).toBeInTheDocument();
    });
  });

  describe("Mixed Content Scenarios", () => {
    it("should handle mixed files and folders", () => {
      const documents = [
        mockFile1,
        mockFile2,
        mockFolder,
        { ...mockFolder, id: "4", name: "Images" },
      ];
      render(<FileManagerStats documents={documents} />);
      expect(screen.getByTestId("value-total-files")).toHaveTextContent("2");
      expect(screen.getByTestId("value-folders")).toHaveTextContent("2");
      expect(screen.getByTestId("value-total-size")).toHaveTextContent("3 KB");
    });

    it("should handle files with various sizes", () => {
      const files = [
        { ...mockFile1, size: 100 },
        { ...mockFile1, id: "2", size: 200 },
        { ...mockFile1, id: "3", size: 724 },
      ];
      render(<FileManagerStats documents={files} />);
      expect(screen.getByTestId("value-total-files")).toHaveTextContent("3");
      expect(screen.getByTestId("value-total-size")).toHaveTextContent("1 KB");
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero-sized files", () => {
      const zeroFile = { ...mockFile1, size: 0 };
      render(<FileManagerStats documents={[zeroFile]} />);
      expect(screen.getByTestId("value-total-files")).toHaveTextContent("1");
      expect(screen.getByTestId("value-total-size")).toHaveTextContent(
        "0 Bytes"
      );
    });

    it("should handle very large file counts", () => {
      const manyFiles = Array.from({ length: 1000 }, (_, i) => ({
        ...mockFile1,
        id: `file-${i}`,
        size: 1024,
      }));
      render(<FileManagerStats documents={manyFiles} />);
      expect(screen.getByTestId("value-total-files")).toHaveTextContent("1000");
    });

    it("should handle single file", () => {
      render(<FileManagerStats documents={[mockFile1]} />);
      expect(screen.getByTestId("value-total-files")).toHaveTextContent("1");
      expect(screen.getByTestId("value-folders")).toHaveTextContent("0");
      expect(screen.getByTestId("value-total-size")).toHaveTextContent("1 KB");
    });

    it("should handle single folder", () => {
      render(<FileManagerStats documents={[mockFolder]} />);
      expect(screen.getByTestId("value-total-files")).toHaveTextContent("0");
      expect(screen.getByTestId("value-folders")).toHaveTextContent("1");
      expect(screen.getByTestId("value-total-size")).toHaveTextContent(
        "0 Bytes"
      );
    });

    it("should handle files with undefined size", () => {
      const fileNoSize = { ...mockFile1, size: undefined as any };
      render(<FileManagerStats documents={[fileNoSize]} />);
      expect(screen.getByTestId("value-total-size")).toHaveTextContent(
        "0 Bytes"
      );
    });
  });

  describe("Size Formatting Edge Cases", () => {
    it("should format exact KB sizes", () => {
      const file = { ...mockFile1, size: 1024 };
      render(<FileManagerStats documents={[file]} />);
      expect(screen.getByTestId("value-total-size")).toHaveTextContent("1 KB");
    });

    it("should format exact MB sizes", () => {
      const file = { ...mockFile1, size: 1048576 };
      render(<FileManagerStats documents={[file]} />);
      expect(screen.getByTestId("value-total-size")).toHaveTextContent("1 MB");
    });

    it("should format fractional sizes correctly", () => {
      const file = { ...mockFile1, size: 1536 }; // 1.5 KB
      render(<FileManagerStats documents={[file]} />);
      expect(screen.getByTestId("value-total-size")).toHaveTextContent(
        "1.5 KB"
      );
    });

    it("should format small byte sizes", () => {
      const file = { ...mockFile1, size: 500 };
      render(<FileManagerStats documents={[file]} />);
      expect(screen.getByTestId("value-total-size")).toHaveTextContent(
        "500 Bytes"
      );
    });
  });
});
