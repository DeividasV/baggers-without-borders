/**
 * Tests for HofManagement component
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import HofManagement from "@/app/components/features/hofs/HofManagement";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

global.fetch = jest.fn();

describe("HofManagement", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  const mockHofs = [
    {
      id: "1",
      code: "BPL",
      title: "Bavarian Prealps List",
      description: "A list of peaks in the Bavarian Prealps",
      displayOrder: 0,
      isActive: true,
      allowManualEntry: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      code: "AAL",
      title: "Austrian Alps List",
      description: "Peaks in Austrian Alps",
      displayOrder: 1,
      isActive: true,
      allowManualEntry: true,
      createdAt: "2024-01-02T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    },
    {
      id: "3",
      code: "IML",
      title: "Inactive Mountain List",
      description: null,
      displayOrder: 2,
      isActive: false,
      allowManualEntry: false,
      createdAt: "2024-01-03T00:00:00Z",
      updatedAt: "2024-01-03T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockHofs,
    });
  });

  it("should show loading state initially", () => {
    render(<HofManagement />);
    expect(screen.getByText("Loading hofs...")).toBeInTheDocument();
  });

  it("should display hofs after loading", async () => {
    render(<HofManagement />);
    await waitFor(() => {
      expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
    });
  });

  it("should fetch hofs on mount", async () => {
    render(<HofManagement />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/hofs");
    });
  });

  it("should display header", async () => {
    render(<HofManagement />);
    await waitFor(() => {
      expect(screen.getByText("Hall of Fame Management")).toBeInTheDocument();
    });
  });

  it("should filter by code search", async () => {
    render(<HofManagement />);
    await waitFor(() => {
      expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by code, title, or description..."
    );
    fireEvent.change(searchInput, { target: { value: "BPL" } });

    await waitFor(() => {
      expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
      expect(screen.queryByText("AAL")).toBeNull();
    });
  });

  it("should filter by title search", async () => {
    render(<HofManagement />);
    await waitFor(() => {
      expect(screen.getAllByText("AAL").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by code, title, or description..."
    );
    fireEvent.change(searchInput, { target: { value: "Austrian" } });

    await waitFor(() => {
      expect(screen.getAllByText("AAL").length).toBeGreaterThan(0);
      expect(screen.queryByText("BPL")).toBeNull();
    });
  });

  it("should be case-insensitive search", async () => {
    render(<HofManagement />);
    await waitFor(() => {
      expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by code, title, or description..."
    );
    fireEvent.change(searchInput, { target: { value: "bavarian" } });

    await waitFor(() => {
      expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
    });
  });

  it("should show empty state for no results", async () => {
    render(<HofManagement />);
    await waitFor(() => {
      expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by code, title, or description..."
    );
    fireEvent.change(searchInput, { target: { value: "NonExistent" } });

    await waitFor(() => {
      expect(screen.getByText("No halls of fame found")).toBeInTheDocument();
    });
  });

  it("should filter by active status", async () => {
    render(<HofManagement />);
    await waitFor(() => {
      expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
    });

    const statusSelect = screen.getByRole("combobox");
    fireEvent.change(statusSelect, { target: { value: "ACTIVE" } });

    await waitFor(() => {
      expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
      expect(screen.getAllByText("AAL").length).toBeGreaterThan(0);
      expect(screen.queryByText("IML")).toBeNull();
    });
  });

  it("should filter by inactive status", async () => {
    render(<HofManagement />);
    await waitFor(() => {
      expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
    });

    const statusSelect = screen.getByRole("combobox");
    fireEvent.change(statusSelect, { target: { value: "INACTIVE" } });

    await waitFor(() => {
      expect(screen.getAllByText("IML").length).toBeGreaterThan(0);
      expect(screen.queryByText("BPL")).toBeNull();
    });
  });

  it("should update URL on search", async () => {
    render(<HofManagement />);
    await waitFor(() => {
      expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by code, title, or description..."
    );
    fireEvent.change(searchInput, { target: { value: "BPL" } });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining("search=BPL"),
        { scroll: false }
      );
    });
  });

  it("should update URL on status filter", async () => {
    render(<HofManagement />);
    await waitFor(() => {
      expect(screen.getAllByText("BPL").length).toBeGreaterThan(0);
    });

    const statusSelect = screen.getByRole("combobox");
    fireEvent.change(statusSelect, { target: { value: "ACTIVE" } });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining("status=ACTIVE"),
        { scroll: false }
      );
    });
  });

  it("should navigate to create page", async () => {
    render(<HofManagement />);
    await waitFor(() => {
      expect(screen.getByText("Create Hall of Fame")).toBeInTheDocument();
    });

    const createButton = screen.getByText("Create Hall of Fame");
    fireEvent.click(createButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/admin/hofs/new");
  });

  it("should handle fetch error", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    render(<HofManagement />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Error fetching hofs:",
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });
});
