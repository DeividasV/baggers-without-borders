import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import ConfigurationManagement from "@/app/components/features/configuration/ConfigurationManagement";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

global.fetch = jest.fn();

describe("ConfigurationManagement", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  const mockConfigs = [
    {
      id: "config1",
      hofId: "hof1",
      yearId: "year1",
      minPeaks: 5,
      minForeignPeaks: 2,
      minFpr: 10,
      notes: null,
      hof: {
        id: "hof1",
        code: "HOF1",
        title: "Hall of Fame 1",
        isActive: true,
      },
      year: {
        id: "year1",
        code: "2024",
        title: "Year 2024",
        isActive: true,
      },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "config2",
      hofId: "hof2",
      yearId: "year2",
      minPeaks: 10,
      minForeignPeaks: 5,
      minFpr: 15,
      notes: "Test notes",
      hof: {
        id: "hof2",
        code: "HOF2",
        title: "Hall of Fame 2",
        isActive: false,
      },
      year: {
        id: "year2",
        code: "2023",
        title: "Year 2023",
        isActive: false,
      },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  ];

  const mockHofs = [
    { id: "hof1", code: "HOF1", title: "Hall of Fame 1", isActive: true },
    { id: "hof2", code: "HOF2", title: "Hall of Fame 2", isActive: false },
  ];

  const mockYears = [
    { id: "year1", code: "2024", title: "Year 2024", isActive: true },
    { id: "year2", code: "2023", title: "Year 2023", isActive: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/hof-year-configs") {
        return Promise.resolve({
          ok: true,
          json: async () => mockConfigs,
        });
      }
      if (url === "/api/hofs") {
        return Promise.resolve({
          ok: true,
          json: async () => mockHofs,
        });
      }
      if (url === "/api/years") {
        return Promise.resolve({
          ok: true,
          json: async () => mockYears,
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });
    });
  });

  it("renders configuration management page", async () => {
    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(
        screen.getByText("Hall of Fame Configuration")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Manage display and filtering settings/i)
    ).toBeInTheDocument();
  });

  it("loads and displays configurations", async () => {
    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("HOF1")).toBeInTheDocument();
      expect(screen.getByText("HOF2")).toBeInTheDocument();
    });
  });

  it("displays stats correctly", async () => {
    render(<ConfigurationManagement />);

    await waitFor(() => {
      // 2 total configs
      const twoElements = screen.getAllByText("2");
      expect(twoElements.length).toBeGreaterThan(0);
      // 1 active (both hof and year active)
      const oneElements = screen.getAllByText("1");
      expect(oneElements.length).toBeGreaterThan(0);
    });
  });

  it("filters by search term", async () => {
    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("HOF1")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by HoF or Year/i);
    fireEvent.change(searchInput, { target: { value: "HOF1" } });

    await waitFor(() => {
      expect(screen.getByText("HOF1")).toBeInTheDocument();
      expect(screen.queryByText("HOF2")).not.toBeInTheDocument();
    });
  });

  it("filters by HoF", async () => {
    const user = userEvent.setup();
    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("HOF1")).toBeInTheDocument();
    });

    const hofFilter = screen.getAllByRole("combobox")[0];
    await user.selectOptions(hofFilter, "hof1");

    await waitFor(() => {
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "1 record";
        })
      ).toBeInTheDocument();
    });
  });

  it("filters by Year", async () => {
    const user = userEvent.setup();
    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("HOF1")).toBeInTheDocument();
    });

    const yearFilter = screen.getAllByRole("combobox")[1];
    await user.selectOptions(yearFilter, "year1");

    await waitFor(() => {
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "1 record";
        })
      ).toBeInTheDocument();
    });
  });

  it("clears all filters", async () => {
    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("HOF1")).toBeInTheDocument();
    });

    // Apply filters
    const searchInput = screen.getByPlaceholderText(/Search by HoF or Year/i);
    fireEvent.change(searchInput, { target: { value: "HOF1" } });

    // Click clear button
    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(searchInput).toHaveValue("");
    });
  });

  it("navigates to create configuration page", async () => {
    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("Create Configuration")).toBeInTheDocument();
    });

    const createButton = screen.getByText("Create Configuration");
    fireEvent.click(createButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/admin/configuration/new");
  });

  it("navigates to HoFs management page", async () => {
    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("Manage HoFs")).toBeInTheDocument();
    });

    const manageHofsButton = screen.getByText("Manage HoFs");
    fireEvent.click(manageHofsButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/admin/hofs");
  });

  it("navigates to Years management page", async () => {
    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("Manage Years")).toBeInTheDocument();
    });

    const manageYearsButton = screen.getByText("Manage Years");
    fireEvent.click(manageYearsButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/admin/years");
  });

  it("navigates to config detail on row click", async () => {
    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("HOF1")).toBeInTheDocument();
    });

    const row = screen.getByText("HOF1").closest("tr");
    if (row) {
      fireEvent.click(row);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.stringContaining("/admin/configuration/config1")
        );
      });
    }
  });

  it("shows empty state when no configs", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/hof-year-configs") {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (url === "/api/hofs") {
        return Promise.resolve({ ok: true, json: async () => mockHofs });
      }
      if (url === "/api/years") {
        return Promise.resolve({ ok: true, json: async () => mockYears });
      }
      return Promise.resolve({ ok: false });
    });

    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("No configurations found")).toBeInTheDocument();
    });
  });

  it("shows filtered empty state", async () => {
    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("HOF1")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by HoF or Year/i);
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    await waitFor(() => {
      expect(screen.getByText("No configurations found")).toBeInTheDocument();
      expect(
        screen.getByText("Try adjusting your filters")
      ).toBeInTheDocument();
    });
  });

  it("updates URL with search params", async () => {
    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("HOF1")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by HoF or Year/i);
    fireEvent.change(searchInput, { target: { value: "test" } });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining("search=test"),
        expect.any(Object)
      );
    });
  });

  it("loads filters from URL params", async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === "search") return "HOF1";
      if (key === "hofId") return "hof1";
      if (key === "yearId") return "year1";
      return null;
    });

    render(<ConfigurationManagement />);

    await waitFor(() => {
      expect(screen.getByText("HOF1")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by HoF or Year/i);
    expect(searchInput).toHaveValue("HOF1");
  });
});
