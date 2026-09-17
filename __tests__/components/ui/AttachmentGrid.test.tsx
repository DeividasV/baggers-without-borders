import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AttachmentGrid from "@/app/components/ui/AttachmentGrid";

const mockAttachments = [
  {
    id: "1",
    filename: "image1.jpg",
    originalName: "Mountain Photo.jpg",
    mimeType: "image/jpeg",
    size: 1048576, // 1 MB
    path: "/uploads/image1.jpg",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    filename: "document.pdf",
    originalName: "Report.pdf",
    mimeType: "application/pdf",
    size: 2097152, // 2 MB
    path: "/uploads/document.pdf",
    createdAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    filename: "text.txt",
    originalName: "Notes.txt",
    mimeType: "text/plain",
    size: 1024, // 1 KB
    path: "/uploads/text.txt",
    createdAt: "2024-01-03T00:00:00Z",
  },
];

describe("AttachmentGrid Component", () => {
  beforeEach(() => {
    window.confirm = jest.fn();
  });

  describe("Basic Rendering", () => {
    it("should render nothing with empty attachments", () => {
      const { container } = render(<AttachmentGrid attachments={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("should render grid with attachments", () => {
      render(<AttachmentGrid attachments={mockAttachments} />);
      expect(screen.getByText("Mountain Photo.jpg")).toBeInTheDocument();
      expect(screen.getByText("Report.pdf")).toBeInTheDocument();
      expect(screen.getByText("Notes.txt")).toBeInTheDocument();
    });

    it("should render correct number of attachment cards", () => {
      const { container } = render(
        <AttachmentGrid attachments={mockAttachments} />
      );
      const cards = container.querySelectorAll(".group.relative.bg-dark-600");
      expect(cards).toHaveLength(3);
    });

    it("should apply grid layout classes", () => {
      const { container } = render(
        <AttachmentGrid attachments={mockAttachments} />
      );
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-2");
      expect(grid).toHaveClass("sm:grid-cols-3");
      expect(grid).toHaveClass("md:grid-cols-4");
      expect(grid).toHaveClass("lg:grid-cols-5");
    });
  });

  describe("File Size Formatting", () => {
    it("should format bytes correctly", () => {
      const attachment = {
        id: "1",
        filename: "tiny.txt",
        originalName: "tiny.txt",
        mimeType: "text/plain",
        size: 500,
        path: "/uploads/tiny.txt",
        createdAt: "2024-01-01T00:00:00Z",
      };
      render(<AttachmentGrid attachments={[attachment]} />);
      expect(screen.getByText("500 Bytes")).toBeInTheDocument();
    });

    it("should format KB correctly", () => {
      const attachment = {
        id: "1",
        filename: "small.txt",
        originalName: "small.txt",
        mimeType: "text/plain",
        size: 1024,
        path: "/uploads/small.txt",
        createdAt: "2024-01-01T00:00:00Z",
      };
      render(<AttachmentGrid attachments={[attachment]} />);
      expect(screen.getByText("1 KB")).toBeInTheDocument();
    });

    it("should format MB correctly", () => {
      const attachment = {
        id: "1",
        filename: "medium.jpg",
        originalName: "medium.jpg",
        mimeType: "image/jpeg",
        size: 1048576,
        path: "/uploads/medium.jpg",
        createdAt: "2024-01-01T00:00:00Z",
      };
      render(<AttachmentGrid attachments={[attachment]} />);
      expect(screen.getByText("1 MB")).toBeInTheDocument();
    });

    it("should format GB correctly", () => {
      const attachment = {
        id: "1",
        filename: "large.mp4",
        originalName: "large.mp4",
        mimeType: "video/mp4",
        size: 1073741824,
        path: "/uploads/large.mp4",
        createdAt: "2024-01-01T00:00:00Z",
      };
      render(<AttachmentGrid attachments={[attachment]} />);
      expect(screen.getByText("1 GB")).toBeInTheDocument();
    });

    it("should handle 0 bytes", () => {
      const attachment = {
        id: "1",
        filename: "empty.txt",
        originalName: "empty.txt",
        mimeType: "text/plain",
        size: 0,
        path: "/uploads/empty.txt",
        createdAt: "2024-01-01T00:00:00Z",
      };
      render(<AttachmentGrid attachments={[attachment]} />);
      expect(screen.getByText("0 Bytes")).toBeInTheDocument();
    });
  });

  describe("Image Attachments", () => {
    it("should render image thumbnail", () => {
      const imageAttachment = mockAttachments[0];
      render(<AttachmentGrid attachments={[imageAttachment]} />);
      const img = screen.getByAltText("Mountain Photo.jpg");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/api/uploads/image1.jpg");
    });

    it("should call onPreviewClick when image is clicked", () => {
      const onPreviewClick = jest.fn();
      const imageAttachment = mockAttachments[0];
      render(
        <AttachmentGrid
          attachments={[imageAttachment]}
          onPreviewClick={onPreviewClick}
        />
      );

      const thumbnail = screen.getByAltText("Mountain Photo.jpg").parentElement;
      fireEvent.click(thumbnail!);

      expect(onPreviewClick).toHaveBeenCalledWith(
        "/api/uploads/image1.jpg",
        "Mountain Photo.jpg"
      );
    });

    it("should show view button on hover", () => {
      const imageAttachment = mockAttachments[0];
      render(<AttachmentGrid attachments={[imageAttachment]} />);
      expect(screen.getByText("View Full")).toBeInTheDocument();
    });
  });

  describe("Non-Image Attachments", () => {
    it("should render PDF file icon", () => {
      const pdfAttachment = mockAttachments[1];
      render(<AttachmentGrid attachments={[pdfAttachment]} />);
      expect(screen.getByText("PDF")).toBeInTheDocument();
    });

    it("should render TXT file icon", () => {
      const txtAttachment = mockAttachments[2];
      render(<AttachmentGrid attachments={[txtAttachment]} />);
      expect(screen.getByText("TXT")).toBeInTheDocument();
    });

    it("should render DOC file type", () => {
      const docAttachment = {
        ...mockAttachments[1],
        mimeType: "application/msword",
      };
      render(<AttachmentGrid attachments={[docAttachment]} />);
      expect(screen.getByText("DOC")).toBeInTheDocument();
    });

    it("should render generic FILE type for unknown types", () => {
      const unknownAttachment = {
        ...mockAttachments[1],
        mimeType: "application/octet-stream",
      };
      render(<AttachmentGrid attachments={[unknownAttachment]} />);
      expect(screen.getByText("FILE")).toBeInTheDocument();
    });
  });

  describe("Download Functionality", () => {
    it("should render download link for each attachment", () => {
      render(<AttachmentGrid attachments={mockAttachments} />);
      const downloadLinks = screen.getAllByText("Download");
      expect(downloadLinks).toHaveLength(3);
    });

    it("should have correct download attributes", () => {
      render(<AttachmentGrid attachments={[mockAttachments[0]]} />);
      const downloadLink = screen.getByText("Download");
      expect(downloadLink).toHaveAttribute("href", "/api/uploads/image1.jpg");
      expect(downloadLink).toHaveAttribute("download", "Mountain Photo.jpg");
    });
  });

  describe("Delete Functionality", () => {
    it("should not show delete button when editable is false", () => {
      render(<AttachmentGrid attachments={mockAttachments} editable={false} />);
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });

    it("should not show delete button when onDelete is not provided", () => {
      render(<AttachmentGrid attachments={mockAttachments} editable={true} />);
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });

    it("should show delete button when editable and onDelete provided", () => {
      const onDelete = jest.fn();
      render(
        <AttachmentGrid
          attachments={mockAttachments}
          editable={true}
          onDelete={onDelete}
        />
      );
      const deleteButtons = screen.getAllByText("Delete");
      expect(deleteButtons).toHaveLength(3);
    });

    it("should show confirmation dialog when delete is clicked", () => {
      const onDelete = jest.fn();
      (window.confirm as jest.Mock).mockReturnValue(true);

      render(
        <AttachmentGrid
          attachments={[mockAttachments[0]]}
          editable={true}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Mountain Photo.jpg"?'
      );
    });

    it("should call onDelete when confirmed", () => {
      const onDelete = jest.fn();
      (window.confirm as jest.Mock).mockReturnValue(true);

      render(
        <AttachmentGrid
          attachments={[mockAttachments[0]]}
          editable={true}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith("1");
    });

    it("should not call onDelete when cancelled", () => {
      const onDelete = jest.fn();
      (window.confirm as jest.Mock).mockReturnValue(false);

      render(
        <AttachmentGrid
          attachments={[mockAttachments[0]]}
          editable={true}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);

      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe("Attachment Information Display", () => {
    it("should display original file name", () => {
      render(<AttachmentGrid attachments={mockAttachments} />);
      expect(screen.getByText("Mountain Photo.jpg")).toBeInTheDocument();
      expect(screen.getByText("Report.pdf")).toBeInTheDocument();
      expect(screen.getByText("Notes.txt")).toBeInTheDocument();
    });

    it("should display file size", () => {
      render(<AttachmentGrid attachments={mockAttachments} />);
      expect(screen.getByText("1 MB")).toBeInTheDocument();
      expect(screen.getByText("2 MB")).toBeInTheDocument();
      expect(screen.getByText("1 KB")).toBeInTheDocument();
    });

    it("should truncate long file names", () => {
      const longNameAttachment = {
        ...mockAttachments[0],
        originalName:
          "This is a very long file name that should be truncated.jpg",
      };
      const { container } = render(
        <AttachmentGrid attachments={[longNameAttachment]} />
      );
      const nameElement = container.querySelector(".truncate");
      expect(nameElement).toBeInTheDocument();
    });
  });

  describe("Multiple Attachments", () => {
    it("should handle single attachment", () => {
      render(<AttachmentGrid attachments={[mockAttachments[0]]} />);
      expect(screen.getByText("Mountain Photo.jpg")).toBeInTheDocument();
    });

    it("should handle many attachments", () => {
      const manyAttachments = Array.from({ length: 10 }, (_, i) => ({
        ...mockAttachments[0],
        id: `${i}`,
        originalName: `File ${i}.jpg`,
      }));
      const { container } = render(
        <AttachmentGrid attachments={manyAttachments} />
      );
      const cards = container.querySelectorAll(".group.relative.bg-dark-600");
      expect(cards).toHaveLength(10);
    });

    it("should render mixed file types", () => {
      render(<AttachmentGrid attachments={mockAttachments} />);
      expect(screen.getByAltText("Mountain Photo.jpg")).toBeInTheDocument();
      expect(screen.getByText("PDF")).toBeInTheDocument();
      expect(screen.getByText("TXT")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle attachment without onPreviewClick", () => {
      const imageAttachment = mockAttachments[0];
      const { container } = render(
        <AttachmentGrid attachments={[imageAttachment]} />
      );
      const thumbnail = container.querySelector(".cursor-pointer");

      expect(() => fireEvent.click(thumbnail!)).not.toThrow();
    });

    it("should handle very small file sizes", () => {
      const tinyAttachment = {
        ...mockAttachments[0],
        size: 1,
      };
      render(<AttachmentGrid attachments={[tinyAttachment]} />);
      expect(screen.getByText("1 Bytes")).toBeInTheDocument();
    });

    it("should handle very large file sizes", () => {
      const hugeAttachment = {
        ...mockAttachments[0],
        size: 5368709120, // 5 GB
      };
      render(<AttachmentGrid attachments={[hugeAttachment]} />);
      expect(screen.getByText("5 GB")).toBeInTheDocument();
    });

    it("should handle special characters in file names", () => {
      const specialAttachment = {
        ...mockAttachments[0],
        originalName: "File (1) [copy].jpg",
      };
      render(<AttachmentGrid attachments={[specialAttachment]} />);
      expect(screen.getByText("File (1) [copy].jpg")).toBeInTheDocument();
    });
  });

  describe("Styling and Layout", () => {
    it("should apply hover styles", () => {
      const { container } = render(
        <AttachmentGrid attachments={[mockAttachments[0]]} />
      );
      const card = container.querySelector(".group");
      expect(card).toHaveClass("hover:ring-2");
      expect(card).toHaveClass("hover:ring-primary-500");
    });

    it("should apply aspect ratio to images", () => {
      const { container } = render(
        <AttachmentGrid attachments={[mockAttachments[0]]} />
      );
      const imageContainer = container.querySelector(".aspect-square");
      expect(imageContainer).toBeInTheDocument();
    });

    it("should apply background colors", () => {
      const { container } = render(
        <AttachmentGrid attachments={mockAttachments} />
      );
      const cards = container.querySelectorAll(".bg-dark-600");
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
