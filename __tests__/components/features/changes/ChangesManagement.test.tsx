import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangesManagement from "@/components/features/changes/ChangesManagement";

jest.mock("next/navigation");

global.fetch = jest.fn();

const nextNavigation = require("next/navigation");

describe("ChangesManagement", () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockSearchParamsGet = jest.fn();

  const mockChangeRequests = [
    {
      id: "req-1",
      ticketNumber: "BWB-2026-0001",
      ticketSlug: "bwb-2026-0001",
      title: "Feature Request",
      description: "Add new feature",
      type: "FEATURE",
      priority: "HIGH",
      status: "PENDING",
      plannedTime: 120,
      actualTime: null,
      createdAt: "2024-01-01T12:00:00Z",
      createdBy: { id: "user-1", displayName: "John Doe", username: "johndoe" },
      voteSummary: { totalVotes: 2, averageVote: 4.5 },
      _count: { attachments: 2 },
      isFromGit: true,
    },
    {
      id: "req-2",
      ticketNumber: "BWB-2026-0002",
      ticketSlug: "bwb-2026-0002",
      title: "Bug Fix",
      description: "Fix critical bug",
      type: "BUG",
      priority: "CRITICAL",
      status: "COMPLETED",
      plannedTime: 60,
      actualTime: 75,
      createdAt: "2024-01-02T12:00:00Z",
      createdBy: { id: "user-2", displayName: "Jane Smith", username: "janesmith" },
      voteSummary: { totalVotes: 1, averageVote: 5 },
      _count: { attachments: 0 },
      isFromGit: false,
    },
  ];

  const installDefaultFetchMock = () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      const urlObj = new URL(url, "http://localhost");
      const search = urlObj.searchParams.get("search")?.toLowerCase() || "";
      const limit = urlObj.searchParams.get("limit") || "20";
      const source = urlObj.searchParams.get("source") || "ALL";

      const filtered = mockChangeRequests.filter((request) => {
        const matchesSearch =
          !search ||
          request.ticketNumber.toLowerCase().includes(search) ||
          request.title.toLowerCase().includes(search) ||
          request.description.toLowerCase().includes(search) ||
          request.createdBy.displayName.toLowerCase().includes(search) ||
          request.createdBy.username.toLowerCase().includes(search);

        const matchesSource =
          source === "ALL" ||
          (source === "GIT" && request.isFromGit) ||
          (source === "MANUAL" && !request.isFromGit);

        return matchesSearch && matchesSource;
      });

      const data = limit === "99999" ? mockChangeRequests : filtered;

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data, total: data.length }),
      });
    });
  };

  const renderComponent = () => render(<ChangesManagement />);

  const waitForLoadedState = async () => {
    await waitFor(
      () => {
        expect(screen.queryByText("Loading change requests...")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText("Change Requests")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  };

  const advanceSearchDebounce = () => {
    act(() => {
      jest.advanceTimersByTime(500);
    });
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();

    nextNavigation.useRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: jest.fn(),
      pathname: "/admin/changes",
      query: {},
      asPath: "/admin/changes",
    });

    const mockSearchParams = new URLSearchParams();
    mockSearchParams.get = mockSearchParamsGet;
    nextNavigation.useSearchParams.mockReturnValue(mockSearchParams);

    mockSearchParamsGet.mockReturnValue(null);
    installDefaultFetchMock();
  });

  afterEach(() => {
    cleanup();
    try {
      jest.clearAllTimers();
    } catch {
      // Real timers were active.
    }
    jest.useRealTimers();
  });

  it("renders the page shell and loaded table", async () => {
    renderComponent();

    expect(screen.getByText("Loading change requests...")).toBeInTheDocument();

    await waitForLoadedState();

    expect(screen.getByText(/Review and manage change requests/i)).toBeInTheDocument();
    expect(screen.getByText("Ticket & Likes")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Type & Priority")).toBeInTheDocument();
    expect(screen.getAllByText("Feature Request").length).toBeGreaterThan(0);
  });

  it("shows a retryable error state when the list request fails", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error("Failed to fetch"))
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Unable to load change requests")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
  });

  it("renders stats and like summaries from the loaded data", async () => {
    renderComponent();

    await waitForLoadedState();

    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();
    expect(screen.getAllByText(/likes/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1h15/).length).toBeGreaterThan(0);
  });

  it("renders top-liked shortcuts as accessible links", async () => {
    renderComponent();

    await waitForLoadedState();

    expect(
      screen.getByRole("link", {
        name: /Open change request ranked 1: Feature Request/i,
      })
    ).toHaveAttribute("href", "/admin/changes/bwb-2026-0001?returnTo=%2Fadmin%2Fchanges");
  });

  it("shows likes before ticket id and date in the list column", async () => {
    renderComponent();

    await waitForLoadedState();

    const ticketText = screen.getAllByText("BWB-2026-0001")[0];
    const ticketCell = ticketText.closest("td");

    expect(ticketCell).not.toBeNull();
    expect(ticketCell?.textContent).toMatch(/2 likes,\s*4\.5\/5\s*BWB-2026-0001\s*2024-01-01/);
  });

  it("debounces search requests and updates the URL", async () => {
    jest.useFakeTimers();
    renderComponent();

    await waitForLoadedState();
    jest.clearAllMocks();

    fireEvent.change(
      screen.getByPlaceholderText(/Search by ticket number, title, description, or creator/i),
      { target: { value: "Bug" } }
    );

    expect(global.fetch).not.toHaveBeenCalled();

    advanceSearchDebounce();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/search=Bug/),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText("Bug Fix").length).toBeGreaterThan(0);
    });

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("search=Bug"),
      expect.any(Object)
    );
  });

  it("initializes the source filter from the URL", async () => {
    mockSearchParamsGet.mockImplementation((key: string) => (key === "source" ? "GIT" : null));

    renderComponent();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/source=GIT/),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining("source=GIT"),
        expect.any(Object)
      );
    });
  });

  it("shows the filtering indicator while a debounced search request is pending", async () => {
    jest.useFakeTimers();
    renderComponent();

    await waitForLoadedState();

    let resolveSearchRequest: ((value: unknown) => void) | null = null;
    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSearchRequest = resolve;
        })
    );

    fireEvent.change(
      screen.getByPlaceholderText(/Search by ticket number, title, description, or creator/i),
      { target: { value: "Bug" } }
    );
    advanceSearchDebounce();

    await waitFor(() => {
      expect(screen.getByText("Filtering...")).toBeInTheDocument();
    });

    resolveSearchRequest?.({
      ok: true,
      status: 200,
      json: async () => ({ data: [mockChangeRequests[1]], total: 1 }),
    });

    await waitFor(() => {
      expect(screen.getAllByText("Bug Fix").length).toBeGreaterThan(0);
    });
  });
});
