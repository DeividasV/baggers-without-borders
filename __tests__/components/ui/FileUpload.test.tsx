import { render, screen, fireEvent } from "@testing-library/react";
import FileUpload from "@/app/components/ui/FileUpload";

describe("FileUpload Component", () => {
  const mockOnFilesChange = jest.fn();
  const defaultProps = {
    files: [],
    onFilesChange: mockOnFilesChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render upload area", () => {
      const { container } = render(<FileUpload {...defaultProps} />);
      expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
    });

    it("should render label when provided", () => {
      render(<FileUpload {...defaultProps} label="Upload Documents" />);
      expect(screen.getByText("Upload Documents")).toBeInTheDocument();
    });

    it("should not render label when not provided", () => {
      const { container } = render(<FileUpload {...defaultProps} />);
      expect(
        container.querySelector(".text-sm.font-medium.text-gray-300")
      ).not.toBeInTheDocument();
    });

    it("should render helper text", () => {
      render(<FileUpload {...defaultProps} />);
      expect(
        screen.getByText(/Images, PDF, TXT, DOC, DOCX/)
      ).toBeInTheDocument();
    });

    it("should render custom helper text", () => {
      render(<FileUpload {...defaultProps} helperText="Max 5MB per file" />);
      expect(screen.getByText("Max 5MB per file")).toBeInTheDocument();
    });

    it("should render upload icon", () => {
      const { container } = render(<FileUpload {...defaultProps} />);
      expect(container.querySelector(".lucide-upload")).toBeInTheDocument();
    });

    it("should render upload instructions", () => {
      render(<FileUpload {...defaultProps} />);
      expect(
        screen.getByText(/Drag and drop files here, or click to select/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Upload screenshots, documents, and supporting materials/
        )
      ).toBeInTheDocument();
    });
  });

  describe("File Selection", () => {
    it("should call onFilesChange when files selected", () => {
      const { container } = render(<FileUpload {...defaultProps} />);
      const input = container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(input, { target: { files: [file] } });

      expect(mockOnFilesChange).toHaveBeenCalledWith([file]);
    });

    it("should append new files to existing files", () => {
      const existingFile = new File(["existing"], "existing.pdf", {
        type: "application/pdf",
      });
      render(<FileUpload {...defaultProps} files={[existingFile]} />);

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const newFile = new File(["new"], "new.pdf", { type: "application/pdf" });

      fireEvent.change(input, { target: { files: [newFile] } });

      expect(mockOnFilesChange).toHaveBeenCalledWith([existingFile, newFile]);
    });

    it("should handle multiple file selection", () => {
      render(<FileUpload {...defaultProps} multiple={true} />);
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      const file1 = new File(["content1"], "test1.pdf", {
        type: "application/pdf",
      });
      const file2 = new File(["content2"], "test2.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(input, { target: { files: [file1, file2] } });

      expect(mockOnFilesChange).toHaveBeenCalledWith([file1, file2]);
    });

    it("should not trigger change when no files selected", () => {
      render(<FileUpload {...defaultProps} />);
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { files: null } });

      expect(mockOnFilesChange).not.toHaveBeenCalled();
    });
  });

  describe("File Attributes", () => {
    it("should set accept attribute", () => {
      render(<FileUpload {...defaultProps} />);
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(input.accept).toBe("image/*,.pdf,.txt,.doc,.docx");
    });

    it("should set custom accept attribute", () => {
      render(<FileUpload {...defaultProps} accept=".jpg,.png" />);
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(input.accept).toBe(".jpg,.png");
    });

    it("should set multiple attribute when multiple=true", () => {
      render(<FileUpload {...defaultProps} multiple={true} />);
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(input.multiple).toBe(true);
    });

    it("should not set multiple attribute when multiple=false", () => {
      render(<FileUpload {...defaultProps} multiple={false} />);
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(input.multiple).toBe(false);
    });

    it("should disable input when disabled=true", () => {
      render(<FileUpload {...defaultProps} disabled={true} />);
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it("should not disable input when disabled=false", () => {
      render(<FileUpload {...defaultProps} disabled={false} />);
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(input.disabled).toBe(false);
    });
  });

  describe("File Preview", () => {
    it("should not show preview grid when no files", () => {
      render(<FileUpload {...defaultProps} files={[]} />);
      expect(screen.queryByText(/Files to upload/)).not.toBeInTheDocument();
    });

    it("should show preview grid when files exist", () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      render(<FileUpload {...defaultProps} files={[file]} />);
      expect(screen.getByText("Files to upload (1):")).toBeInTheDocument();
    });

    it("should display file count", () => {
      const files = [
        new File(["1"], "file1.pdf", { type: "application/pdf" }),
        new File(["2"], "file2.pdf", { type: "application/pdf" }),
      ];
      render(<FileUpload {...defaultProps} files={files} />);
      expect(screen.getByText("Files to upload (2):")).toBeInTheDocument();
    });

    it("should render file name", () => {
      const file = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });
      render(<FileUpload {...defaultProps} files={[file]} />);
      expect(screen.getByText("document.pdf")).toBeInTheDocument();
    });

    it("should render file size", () => {
      const file = new File(["a".repeat(1024)], "test.pdf", {
        type: "application/pdf",
      });
      render(<FileUpload {...defaultProps} files={[file]} />);
      expect(screen.getByText("1 KB")).toBeInTheDocument();
    });

    it("should render image preview when image file", () => {
      const file = new File(["content"], "image.jpg", { type: "image/jpeg" });
      const previewUrls = new Map([
        ["image.jpg", "data:image/jpeg;base64,abc"],
      ]);
      const { container } = render(
        <FileUpload
          {...defaultProps}
          files={[file]}
          previewUrls={previewUrls}
        />
      );
      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img?.src).toContain("data:image/jpeg;base64,abc");
    });

    it("should not render image preview when not image file", () => {
      const file = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });
      const { container } = render(
        <FileUpload {...defaultProps} files={[file]} />
      );
      expect(container.querySelector("img")).not.toBeInTheDocument();
    });

    it("should render FileText icon for non-image files", () => {
      const file = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });
      const { container } = render(
        <FileUpload {...defaultProps} files={[file]} />
      );
      expect(container.querySelector(".lucide-file-text")).toBeInTheDocument();
    });

    it("should display PDF label for PDF files", () => {
      const file = new File(["content"], "doc.pdf", {
        type: "application/pdf",
      });
      render(<FileUpload {...defaultProps} files={[file]} />);
      expect(screen.getByText("PDF")).toBeInTheDocument();
    });

    it("should display DOC label for Word files", () => {
      const file = new File(["content"], "doc.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      render(<FileUpload {...defaultProps} files={[file]} />);
      expect(screen.getByText("DOC")).toBeInTheDocument();
    });

    it("should display TXT label for text files", () => {
      const file = new File(["content"], "doc.txt", { type: "text/plain" });
      render(<FileUpload {...defaultProps} files={[file]} />);
      expect(screen.getByText("TXT")).toBeInTheDocument();
    });

    it("should display FILE label for unknown file types", () => {
      const file = new File(["content"], "doc.xyz", {
        type: "application/octet-stream",
      });
      render(<FileUpload {...defaultProps} files={[file]} />);
      expect(screen.getByText("FILE")).toBeInTheDocument();
    });
  });

  describe("File Removal", () => {
    it("should show remove button on hover", () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const { container } = render(
        <FileUpload {...defaultProps} files={[file]} />
      );
      const removeButton = container.querySelector(".lucide-x")?.parentElement;
      expect(removeButton).toBeInTheDocument();
    });

    it("should call onFilesChange when remove button clicked", () => {
      const file1 = new File(["1"], "file1.pdf", { type: "application/pdf" });
      const file2 = new File(["2"], "file2.pdf", { type: "application/pdf" });
      const { container } = render(
        <FileUpload {...defaultProps} files={[file1, file2]} />
      );

      const removeButtons = container.querySelectorAll(".lucide-x");
      fireEvent.click(removeButtons[0].parentElement as HTMLButtonElement);

      expect(mockOnFilesChange).toHaveBeenCalledWith([file2]);
    });

    it("should remove correct file by index", () => {
      const file1 = new File(["1"], "file1.pdf", { type: "application/pdf" });
      const file2 = new File(["2"], "file2.pdf", { type: "application/pdf" });
      const file3 = new File(["3"], "file3.pdf", { type: "application/pdf" });
      const { container } = render(
        <FileUpload {...defaultProps} files={[file1, file2, file3]} />
      );

      const removeButtons = container.querySelectorAll(".lucide-x");
      fireEvent.click(removeButtons[1].parentElement as HTMLButtonElement);

      expect(mockOnFilesChange).toHaveBeenCalledWith([file1, file3]);
    });

    it("should disable remove button when disabled", () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const { container } = render(
        <FileUpload {...defaultProps} files={[file]} disabled={true} />
      );
      const removeButton = container.querySelector(".lucide-x")
        ?.parentElement as HTMLButtonElement;
      expect(removeButton.disabled).toBe(true);
    });
  });

  describe("Image Preview Click", () => {
    it("should call onPreviewClick when image clicked", () => {
      const mockOnPreviewClick = jest.fn();
      const file = new File(["content"], "image.jpg", { type: "image/jpeg" });
      const previewUrls = new Map([
        ["image.jpg", "data:image/jpeg;base64,abc"],
      ]);

      const { container } = render(
        <FileUpload
          {...defaultProps}
          files={[file]}
          previewUrls={previewUrls}
          onPreviewClick={mockOnPreviewClick}
        />
      );

      const imageButton = container.querySelector(
        "button[aria-label^='View']"
      ) as HTMLButtonElement;
      fireEvent.click(imageButton);

      expect(mockOnPreviewClick).toHaveBeenCalledWith(
        "data:image/jpeg;base64,abc",
        "image.jpg"
      );
    });

    it("should not call onPreviewClick when onPreviewClick not provided", () => {
      const file = new File(["content"], "image.jpg", { type: "image/jpeg" });
      const previewUrls = new Map([
        ["image.jpg", "data:image/jpeg;base64,abc"],
      ]);

      const { container } = render(
        <FileUpload
          {...defaultProps}
          files={[file]}
          previewUrls={previewUrls}
        />
      );

      const imageButton = container.querySelector("img")
        ?.parentElement as HTMLButtonElement;
      // Should not throw error
      fireEvent.click(imageButton);
    });
  });

  describe("File Size Formatting", () => {
    it("should format 0 bytes", () => {
      const file = new File([""], "empty.txt", { type: "text/plain" });
      render(<FileUpload {...defaultProps} files={[file]} />);
      expect(screen.getByText("0 Bytes")).toBeInTheDocument();
    });

    it("should format bytes", () => {
      const file = new File(["a".repeat(500)], "test.txt", {
        type: "text/plain",
      });
      render(<FileUpload {...defaultProps} files={[file]} />);
      expect(screen.getByText("500 Bytes")).toBeInTheDocument();
    });

    it("should format kilobytes", () => {
      const file = new File(["a".repeat(2048)], "test.txt", {
        type: "text/plain",
      });
      render(<FileUpload {...defaultProps} files={[file]} />);
      expect(screen.getByText("2 KB")).toBeInTheDocument();
    });

    it("should format megabytes", () => {
      const file = new File(["a".repeat(3 * 1024 * 1024)], "test.pdf", {
        type: "application/pdf",
      });
      render(<FileUpload {...defaultProps} files={[file]} />);
      expect(screen.getByText("3 MB")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply hover effect on upload area", () => {
      const { container } = render(<FileUpload {...defaultProps} />);
      const uploadArea = container.querySelector(".border-dashed");
      expect(uploadArea).toHaveClass("hover:border-primary-500");
    });

    it("should apply cursor pointer on upload button", () => {
      const { container } = render(<FileUpload {...defaultProps} />);
      const button = container.querySelector("button");
      expect(button).toHaveClass("cursor-pointer");
    });

    it("should show grid layout for file previews", () => {
      const files = [
        new File(["1"], "file1.pdf", { type: "application/pdf" }),
        new File(["2"], "file2.pdf", { type: "application/pdf" }),
      ];
      const { container } = render(
        <FileUpload {...defaultProps} files={files} />
      );
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-2");
      expect(grid).toHaveClass("sm:grid-cols-3");
      expect(grid).toHaveClass("md:grid-cols-4");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty files array", () => {
      const { container } = render(<FileUpload {...defaultProps} files={[]} />);
      expect(container.querySelector(".grid")).not.toBeInTheDocument();
    });

    it("should handle files without preview URLs", () => {
      const file = new File(["content"], "image.jpg", { type: "image/jpeg" });
      const { container } = render(
        <FileUpload {...defaultProps} files={[file]} />
      );
      expect(container.querySelector("img")).not.toBeInTheDocument();
      expect(container.querySelector(".lucide-file-text")).toBeInTheDocument();
    });

    it("should handle long file names with truncation", () => {
      const longName = "a".repeat(100) + ".pdf";
      const file = new File(["content"], longName, { type: "application/pdf" });
      render(<FileUpload {...defaultProps} files={[file]} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it("should handle remove button click with stopPropagation", () => {
      const file = new File(["content"], "image.jpg", { type: "image/jpeg" });
      const previewUrls = new Map([
        ["image.jpg", "data:image/jpeg;base64,abc"],
      ]);
      const mockOnPreviewClick = jest.fn();

      const { container } = render(
        <FileUpload
          {...defaultProps}
          files={[file]}
          previewUrls={previewUrls}
          onPreviewClick={mockOnPreviewClick}
        />
      );

      const removeButton = container.querySelector(".lucide-x")
        ?.parentElement as HTMLButtonElement;
      fireEvent.click(removeButton);

      expect(mockOnFilesChange).toHaveBeenCalled();
      expect(mockOnPreviewClick).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have file input id", () => {
      const { container } = render(<FileUpload {...defaultProps} />);
      const input = container.querySelector('input[type="file"]');
      expect(input?.id).toBe("file-upload");
    });

    it("should have associated input for upload button", () => {
      const { container } = render(<FileUpload {...defaultProps} />);
      const input = container.querySelector("input[type='file']");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("id", "file-upload");
    });

    it("should have remove button title", () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const { container } = render(
        <FileUpload {...defaultProps} files={[file]} />
      );
      const removeButton = container.querySelector(".lucide-x")
        ?.parentElement as HTMLButtonElement;
      expect(removeButton.title).toBe("Remove file");
    });

    it('should have button type="button" on remove buttons', () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const { container } = render(
        <FileUpload {...defaultProps} files={[file]} />
      );
      const removeButton = container.querySelector(".lucide-x")
        ?.parentElement as HTMLButtonElement;
      expect(removeButton.type).toBe("button");
    });

    it('should have button type="button" on image preview button', () => {
      const file = new File(["content"], "image.jpg", { type: "image/jpeg" });
      const previewUrls = new Map([
        ["image.jpg", "data:image/jpeg;base64,abc"],
      ]);
      const { container } = render(
        <FileUpload
          {...defaultProps}
          files={[file]}
          previewUrls={previewUrls}
          onPreviewClick={() => {}}
        />
      );
      const imageButton = container.querySelector(
        "button[aria-label^='View']"
      ) as HTMLButtonElement;
      expect(imageButton.type).toBe("button");
    });
  });
});
