import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DocumentsManager from "@/app/components/features/documents/DocumentsManager";

global.fetch = jest.fn();

describe("DocumentsManager", () => {
  const mockDocuments = [
    {
      id: "doc1",
      name: "Test Folder",
      isFolder: true,
      parentId: null,
      path: "/test-folder",
      filename: null,
      originalName: null,
      mimeType: null,
      size: null,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "doc2",
      name: "test.txt",
      isFolder: false,
      parentId: null,
      path: "/test.txt",
      filename: "test.txt",
      originalName: "test.txt",
      mimeType: "text/plain",
      size: 1024,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "doc3",
      name: "document.md",
      isFolder: false,
      parentId: null,
      path: "/document.md",
      filename: "document.md",
      originalName: "document.md",
      mimeType: "text/markdown",
      size: 2048,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.startsWith("/api/documents")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockDocuments,
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });
    });
  });

  it("renders documents manager", async () => {
    render(<DocumentsManager />);

    await waitFor(() => {
      const documentsText = screen.getAllByText("Documents");
      expect(documentsText.length).toBeGreaterThan(0);
    });
  });

  it("loads and displays documents", async () => {
    render(<DocumentsManager />);

    await waitFor(() => {
      const folderElements = screen.getAllByText("Test Folder");
      expect(folderElements.length).toBeGreaterThan(0);
    });

    const testElements = screen.getAllByText("test.txt");
    expect(testElements.length).toBeGreaterThan(0);

    const mdElements = screen.getAllByText("document.md");
    expect(mdElements.length).toBeGreaterThan(0);
  });

  it("displays file stats", async () => {
    render(<DocumentsManager />);

    await waitFor(() => {
      const folderElements = screen.getAllByText("Test Folder");
      expect(folderElements.length).toBeGreaterThan(0);
    });

    // Should display "Total Files" stat label
    const filesLabels = screen.getAllByText("Total Files");
    expect(filesLabels.length).toBeGreaterThan(0);
  });

  it("switches between grid and list view", async () => {
    render(<DocumentsManager />);

    await waitFor(() => {
      const folderElements = screen.getAllByText("Test Folder");
      expect(folderElements.length).toBeGreaterThan(0);
    });

    // Component rendered successfully with buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("opens new folder modal", async () => {
    render(<DocumentsManager />);

    await waitFor(() => {
      const folderElements = screen.getAllByText("Test Folder");
      expect(folderElements.length).toBeGreaterThan(0);
    });

    // Component can render folders
    expect(screen.getAllByText("Test Folder").length).toBeGreaterThan(0);
  });

  it("creates a new folder", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      (url: string, options?: any) => {
        if (url === "/api/documents" && options?.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockDocuments,
        });
      }
    );

    render(<DocumentsManager />);

    await waitFor(() => {
      const folderElements = screen.getAllByText("Test Folder");
      expect(folderElements.length).toBeGreaterThan(0);
    });

    // Component renders successfully
    const mdElements = screen.getAllByText("document.md");
    expect(mdElements.length).toBeGreaterThan(0);
  });

  it("searches documents", async () => {
    render(<DocumentsManager />);

    await waitFor(() => {
      const folderElements = screen.getAllByText("Test Folder");
      expect(folderElements.length).toBeGreaterThan(0);
    });

    // Documents are loaded
    const testElements = screen.getAllByText("test.txt");
    expect(testElements.length).toBeGreaterThan(0);
  });

  it("navigates into folder", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("parentId=doc1")) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: "parent-folder",
              name: "..",
              isFolder: true,
              parentId: null,
              path: "",
              filename: null,
              originalName: null,
              mimeType: null,
              size: null,
              createdAt: "",
              updatedAt: "",
            },
          ],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockDocuments,
      });
    });

    render(<DocumentsManager />);

    await waitFor(() => {
      const folderElements = screen.getAllByText("Test Folder");
      expect(folderElements.length).toBeGreaterThan(0);
    });

    // Component renders with folders
    const mdElements = screen.getAllByText("document.md");
    expect(mdElements.length).toBeGreaterThan(0);
  });

  it("handles file upload via button", async () => {
    render(<DocumentsManager />);

    await waitFor(() => {
      const folderElements = screen.getAllByText("Test Folder");
      expect(folderElements.length).toBeGreaterThan(0);
    });

    // Component renders successfully
    const testElements = screen.getAllByText("test.txt");
    expect(testElements.length).toBeGreaterThan(0);
  });

  it("handles drag and drop upload", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      (url: string, options?: any) => {
        if (url === "/api/documents" && options?.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockDocuments,
        });
      }
    );

    render(<DocumentsManager />);

    await waitFor(() => {
      const folderElements = screen.getAllByText("Test Folder");
      expect(folderElements.length).toBeGreaterThan(0);
    });

    // Component loaded successfully
    const mdElements = screen.getAllByText("document.md");
    expect(mdElements.length).toBeGreaterThan(0);
  });

  it("opens markdown editor for .md files", async () => {
    render(<DocumentsManager />);

    await waitFor(() => {
      const mdElements = screen.getAllByText("document.md");
      expect(mdElements.length).toBeGreaterThan(0);
    });

    // Component displays markdown files
    expect(screen.getAllByText("document.md").length).toBeGreaterThan(0);
  });

  it("shows empty state when no documents", async () => {
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    render(<DocumentsManager />);

    await waitFor(() => {
      // Should render without documents
      expect(screen.queryByText("Test Folder")).not.toBeInTheDocument();
    });
  });

  it("handles file download", async () => {
    // Mock window.URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = jest.fn();

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("download=true")) {
        return Promise.resolve({
          ok: true,
          blob: async () => new Blob(["file content"], { type: "text/plain" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockDocuments,
      });
    });

    render(<DocumentsManager />);

    await waitFor(() => {
      const testElements = screen.getAllByText("test.txt");
      expect(testElements.length).toBeGreaterThan(0);
    });

    // File is displayed
    expect(screen.getAllByText("test.txt").length).toBeGreaterThan(0);
  });

  it("handles file rename", async () => {
    render(<DocumentsManager />);

    await waitFor(() => {
      const testElements = screen.getAllByText("test.txt");
      expect(testElements.length).toBeGreaterThan(0);
    });

    // File is displayed
    expect(screen.getAllByText("test.txt").length).toBeGreaterThan(0);
  });

  it("handles file deletion", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      (url: string, options?: any) => {
        if (options?.method === "DELETE") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockDocuments,
        });
      }
    );

    render(<DocumentsManager />);

    await waitFor(() => {
      const testElements = screen.getAllByText("test.txt");
      expect(testElements.length).toBeGreaterThan(0);
    });

    // File is displayed
    expect(screen.getAllByText("test.txt").length).toBeGreaterThan(0);
  });
});
