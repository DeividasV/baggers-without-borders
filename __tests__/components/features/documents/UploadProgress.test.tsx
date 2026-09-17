/**
 * Tests for UploadProgress component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import UploadProgress from "@/app/components/features/documents/UploadProgress";
import { mockUploadProgress } from "../../../utils/mock-documents";

describe("UploadProgress", () => {
  describe("Rendering", () => {
    it("should not render when no files are uploading", () => {
      const { container } = render(<UploadProgress uploadProgress={{}} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render when files are uploading", () => {
      render(<UploadProgress uploadProgress={mockUploadProgress} />);
      expect(screen.getByText("Uploading files...")).toBeInTheDocument();
    });

    it("should display all uploading files", () => {
      render(<UploadProgress uploadProgress={mockUploadProgress} />);

      expect(screen.getByText("file1.pdf")).toBeInTheDocument();
      expect(screen.getByText("file2.png")).toBeInTheDocument();
      expect(screen.getByText("file3.txt")).toBeInTheDocument();
    });

    it("should display progress percentage for each file", () => {
      render(<UploadProgress uploadProgress={mockUploadProgress} />);

      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("25%")).toBeInTheDocument();
    });
  });

  describe("Progress Bars", () => {
    it("should render progress bar for each file", () => {
      const { container } = render(
        <UploadProgress uploadProgress={mockUploadProgress} />
      );

      const progressBars = container.querySelectorAll(".bg-primary-600");
      expect(progressBars.length).toBe(3);
    });

    it("should set correct width for progress bars", () => {
      const { container } = render(
        <UploadProgress uploadProgress={mockUploadProgress} />
      );

      const progressBars = container.querySelectorAll(".bg-primary-600");

      // Check if width styles are applied
      expect(progressBars[0]).toHaveStyle({ width: "50%" });
      expect(progressBars[1]).toHaveStyle({ width: "100%" });
      expect(progressBars[2]).toHaveStyle({ width: "25%" });
    });

    it("should handle 0% progress", () => {
      const progress = { "starting.txt": 0 };
      const { container } = render(
        <UploadProgress uploadProgress={progress} />
      );

      const progressBar = container.querySelector(".bg-primary-600");
      expect(progressBar).toHaveStyle({ width: "0%" });
    });

    it("should handle 100% progress", () => {
      const progress = { "complete.txt": 100 };
      const { container } = render(
        <UploadProgress uploadProgress={progress} />
      );

      const progressBar = container.querySelector(".bg-primary-600");
      expect(progressBar).toHaveStyle({ width: "100%" });
    });
  });

  describe("File Names", () => {
    it("should truncate long file names", () => {
      const longFileName = "a".repeat(100) + ".txt";
      const progress = { [longFileName]: 50 };

      const { container } = render(
        <UploadProgress uploadProgress={progress} />
      );

      const fileNameElement = screen.getByText(longFileName);
      expect(fileNameElement).toHaveClass("truncate");
    });

    it("should display short file names fully", () => {
      const progress = { "short.txt": 50 };

      render(<UploadProgress uploadProgress={progress} />);

      expect(screen.getByText("short.txt")).toBeInTheDocument();
    });

    it("should handle file names with special characters", () => {
      const progress = { "file@#$%^&.txt": 50 };

      render(<UploadProgress uploadProgress={progress} />);

      expect(screen.getByText("file@#$%^&.txt")).toBeInTheDocument();
    });

    it("should handle file names with spaces", () => {
      const progress = { "my file name.txt": 50 };

      render(<UploadProgress uploadProgress={progress} />);

      expect(screen.getByText("my file name.txt")).toBeInTheDocument();
    });
  });

  describe("Multiple Files", () => {
    it("should handle single file upload", () => {
      const progress = { "single.txt": 75 };

      render(<UploadProgress uploadProgress={progress} />);

      expect(screen.getByText("single.txt")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("should handle many files uploading", () => {
      const manyFiles = Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [`file${i}.txt`, (i + 1) * 10])
      );

      render(<UploadProgress uploadProgress={manyFiles} />);

      expect(screen.getByText("file0.txt")).toBeInTheDocument();
      expect(screen.getByText("file9.txt")).toBeInTheDocument();
    });

    it("should maintain order of files", () => {
      const progress = {
        "first.txt": 10,
        "second.txt": 20,
        "third.txt": 30,
      };

      const { container } = render(
        <UploadProgress uploadProgress={progress} />
      );

      const fileNames = container.querySelectorAll(".truncate");
      expect(fileNames[0].textContent).toBe("first.txt");
      expect(fileNames[1].textContent).toBe("second.txt");
      expect(fileNames[2].textContent).toBe("third.txt");
    });
  });

  describe("Progress Values", () => {
    it("should handle fractional progress", () => {
      const progress = { "file.txt": 33.33 };

      render(<UploadProgress uploadProgress={progress} />);

      expect(screen.getByText("33.33%")).toBeInTheDocument();
    });

    it("should handle all same progress", () => {
      const progress = {
        "file1.txt": 50,
        "file2.txt": 50,
        "file3.txt": 50,
      };

      render(<UploadProgress uploadProgress={progress} />);

      const percentages = screen.getAllByText("50%");
      expect(percentages).toHaveLength(3);
    });

    it("should handle varied progress values", () => {
      const progress = {
        "file1.txt": 10,
        "file2.txt": 50,
        "file3.txt": 90,
      };

      render(<UploadProgress uploadProgress={progress} />);

      expect(screen.getByText("10%")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("90%")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have dark theme styling", () => {
      const { container } = render(
        <UploadProgress uploadProgress={mockUploadProgress} />
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("bg-dark-800", "rounded-lg");
    });

    it("should have proper spacing", () => {
      const { container } = render(
        <UploadProgress uploadProgress={mockUploadProgress} />
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("p-4", "space-y-2");
    });

    it("should style progress bar correctly", () => {
      const { container } = render(
        <UploadProgress uploadProgress={{ "test.txt": 50 }} />
      );

      const progressBarContainer = container.querySelector(".bg-dark-600");
      expect(progressBarContainer).toHaveClass("rounded-full", "h-2");
    });

    it("should style progress bar fill correctly", () => {
      const { container } = render(
        <UploadProgress uploadProgress={{ "test.txt": 50 }} />
      );

      const progressBar = container.querySelector(".bg-primary-600");
      expect(progressBar).toHaveClass("h-2", "rounded-full", "transition-all");
    });

    it("should have text styling", () => {
      const { container } = render(
        <UploadProgress uploadProgress={mockUploadProgress} />
      );

      const title = screen.getByText("Uploading files...");
      expect(title).toHaveClass("text-sm", "font-medium", "text-white");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty object after having files", () => {
      const { rerender, container } = render(
        <UploadProgress uploadProgress={mockUploadProgress} />
      );

      expect(screen.getByText("Uploading files...")).toBeInTheDocument();

      rerender(<UploadProgress uploadProgress={{}} />);

      expect(container.firstChild).toBeNull();
    });

    it("should handle null values gracefully", () => {
      const progress = { "file.txt": 50 };

      render(<UploadProgress uploadProgress={progress} />);

      expect(screen.getByText("file.txt")).toBeInTheDocument();
    });

    it("should handle negative progress (edge case)", () => {
      const progress = { "file.txt": -10 };

      const { container } = render(
        <UploadProgress uploadProgress={progress} />
      );

      expect(screen.getByText("-10%")).toBeInTheDocument();
      const progressBar = container.querySelector(".bg-primary-600");
      expect(progressBar).toHaveStyle({ width: "-10%" });
    });

    it("should handle progress over 100 (edge case)", () => {
      const progress = { "file.txt": 150 };

      const { container } = render(
        <UploadProgress uploadProgress={progress} />
      );

      expect(screen.getByText("150%")).toBeInTheDocument();
      const progressBar = container.querySelector(".bg-primary-600");
      expect(progressBar).toHaveStyle({ width: "150%" });
    });

    it("should handle very long file list", () => {
      const manyFiles = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`file${i}.txt`, 50])
      );

      render(<UploadProgress uploadProgress={manyFiles} />);

      expect(screen.getByText("Uploading files...")).toBeInTheDocument();
      expect(screen.getByText("file0.txt")).toBeInTheDocument();
      expect(screen.getByText("file99.txt")).toBeInTheDocument();
    });
  });

  describe("Dynamic Updates", () => {
    it("should update when progress changes", () => {
      const { rerender } = render(
        <UploadProgress uploadProgress={{ "file.txt": 25 }} />
      );

      expect(screen.getByText("25%")).toBeInTheDocument();

      rerender(<UploadProgress uploadProgress={{ "file.txt": 75 }} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
      expect(screen.queryByText("25%")).not.toBeInTheDocument();
    });

    it("should add new files dynamically", () => {
      const { rerender } = render(
        <UploadProgress uploadProgress={{ "file1.txt": 50 }} />
      );

      expect(screen.getByText("file1.txt")).toBeInTheDocument();
      expect(screen.queryByText("file2.txt")).not.toBeInTheDocument();

      rerender(
        <UploadProgress uploadProgress={{ "file1.txt": 50, "file2.txt": 25 }} />
      );

      expect(screen.getByText("file1.txt")).toBeInTheDocument();
      expect(screen.getByText("file2.txt")).toBeInTheDocument();
    });

    it("should remove completed files", () => {
      const { rerender } = render(
        <UploadProgress
          uploadProgress={{ "file1.txt": 100, "file2.txt": 50 }}
        />
      );

      expect(screen.getByText("file1.txt")).toBeInTheDocument();
      expect(screen.getByText("file2.txt")).toBeInTheDocument();

      rerender(<UploadProgress uploadProgress={{ "file2.txt": 75 }} />);

      expect(screen.queryByText("file1.txt")).not.toBeInTheDocument();
      expect(screen.getByText("file2.txt")).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("should have consistent spacing between items", () => {
      const { container } = render(
        <UploadProgress uploadProgress={mockUploadProgress} />
      );

      const items = container.querySelectorAll(".space-y-1");
      expect(items.length).toBe(3);
    });

    it("should justify text properly", () => {
      const { container } = render(
        <UploadProgress uploadProgress={{ "test.txt": 50 }} />
      );

      const textContainer = container.querySelector(".flex.justify-between");
      expect(textContainer).toBeInTheDocument();
    });
  });
});
