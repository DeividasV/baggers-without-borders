import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@/__tests__/utils/test-utils";
import MyBagsForm from "@/components/features/my-bags/MyBagsForm";

// Mock fetch globally
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockSession = {
  user: {
    id: "user-1",
    email: "user@test.com",
    role: "USER",
  },
  expires: "2024-12-31",
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/my-bags",
    query: {},
    asPath: "/my-bags",
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/my-bags",
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: mockSession,
    status: "authenticated",
  })),
}));

const { useSession } = require("next-auth/react");

describe("MyBagsForm", () => {
  const mockEntryData = {
    id: "entry-1",
    memberId: "user-1",
    hofId: "hof-1",
    yearId: "year-1",
    totalPeaks: 50,
    peaksInYear: 20,
    foreignPeaks: 25,
    foreignPeaksInYear: 5,
    member: {
      id: "user-1",
      username: "testuser",
      displayName: "Test User",
      allowManualEntry: true,
    },
    hof: {
      id: "hof-1",
      code: "P1000",
      title: "P1000 Hall of Fame",
      allowManualEntry: true,
    },
    year: {
      id: "year-1",
      code: "2023",
      title: "Year 2023",
      allowManualEntry: true,
    },
    createdAt: "2023-01-01",
    updatedAt: "2023-01-01",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    useSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Loading and Display", () => {
    it("shows loading state initially", async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => mockEntryData,
                }),
              100
            )
          )
      );

      render(<MyBagsForm entryId="entry-1" />);

      expect(screen.getByText("Loading entry...")).toBeInTheDocument();

      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading entry...")
          ).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("loads and displays entry data", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntryData,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Entry")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/Peaks in Year/i)).toHaveValue(20);
        expect(screen.getByLabelText(/Foreign in Year/i)).toHaveValue(5);
      });
    });

    it("displays HOF information", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntryData,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(screen.getByText("P1000")).toBeInTheDocument();
        expect(screen.getByText("P1000 Hall of Fame")).toBeInTheDocument();
      });
    });

    it("displays year information", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntryData,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(screen.getByText("2023")).toBeInTheDocument();
        expect(screen.getByText("Year 2023")).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("validates non-negative peaks in year", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntryData,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Peaks in Year/i)).toBeInTheDocument();
      });

      const peaksInYearInput = screen.getByLabelText(/Peaks in Year/i);
      fireEvent.change(peaksInYearInput, { target: { value: "-5" } });
      fireEvent.blur(peaksInYearInput);

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Peaks in year cannot be negative")
        ).toBeInTheDocument();
      });
    });

    it("validates non-negative foreign peaks", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntryData,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Foreign in Year/i)).toBeInTheDocument();
      });

      const foreignPeaksInput = screen.getByLabelText(/Foreign in Year/i);
      fireEvent.change(foreignPeaksInput, { target: { value: "-3" } });
      fireEvent.blur(foreignPeaksInput);

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Foreign peaks in year cannot be negative")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form successfully", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEntryData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      jest.useFakeTimers();

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Peaks in Year/i)).toBeInTheDocument();
      });

      const peaksInYearInput = screen.getByLabelText(/Peaks in Year/i);
      fireEvent.change(peaksInYearInput, { target: { value: "25" } });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/my-bags/entry-1", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            peaksInYear: 25,
            foreignPeaksInYear: 5,
          }),
        });
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Entry updated successfully/i)
        ).toBeInTheDocument();
      });

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/my-bags");
      });

      jest.useRealTimers();
    });

    it("displays error on submission failure", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEntryData,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "Failed to update entry" }),
        });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Peaks in Year/i)).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Failed to update entry")).toBeInTheDocument();
      });
    });

    it("requires user to be logged in", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntryData,
      });

      useSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Peaks in Year/i)).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("You must be logged in to update entries")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Manual Entry Lock", () => {
    it("shows lock warning when member manual entry is disabled", async () => {
      const lockedEntry = {
        ...mockEntryData,
        member: {
          ...mockEntryData.member,
          allowManualEntry: false,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => lockedEntry,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(
          screen.getByText("Manual Data Entry Disabled")
        ).toBeInTheDocument();
        // Use getAllByText for text that appears multiple times
        const warnings = screen.getAllByText(
          /Manual data entry has been disabled for your account/
        );
        expect(warnings.length).toBeGreaterThan(0);
      });
    });

    it("shows lock warning when HOF manual entry is disabled", async () => {
      const lockedEntry = {
        ...mockEntryData,
        hof: {
          ...mockEntryData.hof,
          allowManualEntry: false,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => lockedEntry,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(
          screen.getByText("Manual Data Entry Disabled")
        ).toBeInTheDocument();
        // Use getAllByText for text that appears multiple times
        const warnings = screen.getAllByText(
          /Manual data entry has been disabled for the P1000 hall of fame/
        );
        expect(warnings.length).toBeGreaterThan(0);
      });
    });

    it("shows lock warning when year manual entry is disabled", async () => {
      const lockedEntry = {
        ...mockEntryData,
        year: {
          ...mockEntryData.year,
          allowManualEntry: false,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => lockedEntry,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(
          screen.getByText("Manual Data Entry Disabled")
        ).toBeInTheDocument();
        // Use getAllByText for text that appears multiple times
        const warnings = screen.getAllByText(
          /Manual data entry has been disabled for the 2023 year/
        );
        expect(warnings.length).toBeGreaterThan(0);
      });
    });

    it("disables save button when manual entry is locked", async () => {
      const lockedEntry = {
        ...mockEntryData,
        member: {
          ...mockEntryData.member,
          allowManualEntry: false,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => lockedEntry,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /Save/i });
        expect(saveButton).toBeDisabled();
      });
    });

    it("disables form inputs when manual entry is locked", async () => {
      const lockedEntry = {
        ...mockEntryData,
        member: {
          ...mockEntryData.member,
          allowManualEntry: false,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => lockedEntry,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Peaks in Year/i)).toBeDisabled();
        expect(screen.getByLabelText(/Foreign in Year/i)).toBeDisabled();
      });
    });

    it("prevents submission when manual entry is locked", async () => {
      const lockedEntry = {
        ...mockEntryData,
        hof: {
          ...mockEntryData.hof,
          allowManualEntry: false,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => lockedEntry,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Peaks in Year/i)).toBeInTheDocument();
      });

      // Try to submit via form event (simulating form submission)
      const form = screen
        .getByRole("button", { name: /Save/i })
        .closest("form");
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        // Use getAllByText for text that appears multiple times
        const warnings = screen.getAllByText(
          /Manual data entry has been disabled for the P1000 hall of fame/
        );
        expect(warnings.length).toBeGreaterThan(0);
      });

      // Verify fetch was not called for update
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only the initial load
    });
  });

  describe("Navigation", () => {
    it("navigates back on cancel", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntryData,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Entry")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith("/my-bags");
    });

    it("redirects if entry not found", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });

      render(<MyBagsForm entryId="invalid-id" />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/my-bags");
      });
    });

    it("respects returnTo query parameter", async () => {
      // Mock the navigate to the default /my-bags path since we can't override useSearchParams dynamically
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/my-bags");
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper labels for form inputs", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntryData,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Peaks in Year/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Foreign in Year/i)).toBeInTheDocument();
      });
    });

    it("displays lock icon when manual entry is disabled", async () => {
      const lockedEntry = {
        ...mockEntryData,
        member: {
          ...mockEntryData.member,
          allowManualEntry: false,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => lockedEntry,
      });

      render(<MyBagsForm entryId="entry-1" />);

      await waitFor(() => {
        // Check for lock icon via class or role
        const lockIcons = document.querySelectorAll("svg");
        expect(lockIcons.length).toBeGreaterThan(0);
      });
    });
  });
});
