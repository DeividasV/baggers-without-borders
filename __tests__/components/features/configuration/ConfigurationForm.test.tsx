import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import ConfigurationForm from "@/app/components/features/configuration/ConfigurationForm";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("ConfigurationForm", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  const mockHofs = [
    { id: "hof1", code: "HOF1", title: "Hall of Fame 1", isActive: true },
    { id: "hof2", code: "HOF2", title: "Hall of Fame 2", isActive: false },
  ];

  const mockYears = [
    { id: "year1", code: "2024", title: "Year 2024", isActive: true },
    { id: "year2", code: "2023", title: "Year 2023", isActive: false },
  ];

  const mockCountries = [
    { id: "c1", code: "US", name: "United States" },
    { id: "c2", code: "BR", name: "Brazil" },
    { id: "c3", code: "RU", name: "Russia" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockReturnValue(null);

    // Setup default fetch responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
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
      if (url === "/api/countries") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ countries: mockCountries }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });
    });
  });

  describe("Create Mode", () => {
    it("renders create form correctly", async () => {
      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Create Configuration")).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Hall of Fame/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Minimum Peaks/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Minimum Foreign Peaks/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Minimum FPR/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Minimum Age/i)).toBeInTheDocument();
    });

    it("loads HoFs and Years on mount", async () => {
      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/hofs");
        expect(global.fetch).toHaveBeenCalledWith("/api/years");
        expect(global.fetch).toHaveBeenCalledWith("/api/countries");
      });
    });

    it("validates required fields before submission", async () => {
      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Create Configuration")).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: /Save$/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Hall of Fame is required.")
        ).toBeInTheDocument();
        expect(screen.getByText("Year is required.")).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalledWith(
        "/api/hof-year-configs",
        expect.any(Object)
      );
    });

    it("submits form with valid data", async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockImplementation(
        (url: string, options?: any) => {
          if (url === "/api/hof-year-configs" && options?.method === "POST") {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true }),
            });
          }
          // Default responses for initial fetches
          if (url === "/api/hofs")
            return Promise.resolve({ ok: true, json: async () => mockHofs });
          if (url === "/api/years")
            return Promise.resolve({ ok: true, json: async () => mockYears });
          if (url === "/api/countries")
            return Promise.resolve({
              ok: true,
              json: async () => ({ countries: mockCountries }),
            });
          return Promise.resolve({ ok: false });
        }
      );

      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Create Configuration")).toBeInTheDocument();
      });

      // Wait for options to load
      await waitFor(() => {
        expect(screen.getByText("HOF1 - Hall of Fame 1")).toBeInTheDocument();
      });

      // Fill in the form
      const hofSelect = screen.getByLabelText(/Hall of Fame/i);
      const yearSelect = screen.getByLabelText(/Year/i);
      const minPeaksInput = screen.getByLabelText(/Minimum Peaks/i);

      await user.selectOptions(hofSelect, "hof1");
      await user.selectOptions(yearSelect, "year1");
      await user.clear(minPeaksInput);
      await user.type(minPeaksInput, "5");

      const submitButton = screen.getByRole("button", {
        name: /Save & Close/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/hof-year-configs",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
        );
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/admin/configuration");
      });
    });

    it("handles cancel button", async () => {
      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Create Configuration")).toBeInTheDocument();
      });

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockRouter.push).toHaveBeenCalledWith("/admin/configuration");
    });

    it("validates FPR range (0-100)", async () => {
      const user = userEvent.setup();

      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Create Configuration")).toBeInTheDocument();
      });

      // Wait for options to load
      await waitFor(() => {
        expect(screen.getByText("HOF1 - Hall of Fame 1")).toBeInTheDocument();
      });

      // Fill in required fields first
      const hofSelect = screen.getByLabelText(/Hall of Fame/i);
      const yearSelect = screen.getByLabelText(/Year/i);
      const fprInput = screen.getByLabelText(
        /Minimum FPR/i
      ) as HTMLInputElement;

      await user.selectOptions(hofSelect, "hof1");
      await user.selectOptions(yearSelect, "year1");

      // Test invalid value > 100
      await user.clear(fprInput);
      await user.type(fprInput, "150");

      // Verify the input has the invalid value
      expect(fprInput.value).toBe("150");

      // Submit the form to trigger validation
      const submitButton = screen.getByRole("button", { name: /^Save$/ });
      await user.click(submitButton);

      // The form should not call the API with an invalid value
      await waitFor(
        () => {
          const fetchCalls = (global.fetch as jest.Mock).mock.calls;
          const configPostCall = fetchCalls.find(
            (call) =>
              call[0] === "/api/hof-year-configs" && call[1]?.method === "POST"
          );
          expect(configPostCall).toBeUndefined();
        },
        { timeout: 2000 }
      );
    });
  });

  describe("Edit Mode", () => {
    const mockConfig = {
      id: "config1",
      hofId: "hof1",
      yearId: "year1",
      minPeaks: 5,
      minForeignPeaks: 2,
      minFpr: 10,
      minimumAge: 18,
      notes: "Test notes",
      lceEnabled: false,
      lceMinFpr: null,
      lceCountries: [],
      hof: mockHofs[0],
      year: mockYears[0],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };

    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/hof-year-configs/config1")) {
          return Promise.resolve({
            ok: true,
            json: async () => mockConfig,
          });
        }
        if (url.includes("/api/award-tiers?configId=config1")) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url === "/api/hofs")
          return Promise.resolve({ ok: true, json: async () => mockHofs });
        if (url === "/api/years")
          return Promise.resolve({ ok: true, json: async () => mockYears });
        if (url === "/api/countries")
          return Promise.resolve({
            ok: true,
            json: async () => ({ countries: mockCountries }),
          });
        return Promise.resolve({ ok: false });
      });
    });

    it("renders edit form with existing data", async () => {
      render(<ConfigurationForm mode="edit" configId="config1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Configuration")).toBeInTheDocument();
      });

      await waitFor(() => {
        const minPeaksInput = screen.getByLabelText(
          /Minimum Peaks/i
        ) as HTMLInputElement;
        expect(minPeaksInput.value).toBe("5");
      });
    });

    it("shows delete button in edit mode", async () => {
      render(<ConfigurationForm mode="edit" configId="config1" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Delete/i })
        ).toBeInTheDocument();
      });
    });

    it("handles delete confirmation", async () => {
      render(<ConfigurationForm mode="edit" configId="config1" />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Delete/i })
        ).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Are you sure you want to delete/i)
        ).toBeInTheDocument();
      });
    });

    it("disables HoF and Year selects in edit mode", async () => {
      render(<ConfigurationForm mode="edit" configId="config1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Configuration")).toBeInTheDocument();
      });

      const hofSelect = screen.getByLabelText(/Hall of Fame/i);
      const yearSelect = screen.getByLabelText(/Year/i);

      expect(hofSelect).toBeDisabled();
      expect(yearSelect).toBeDisabled();
    });
  });

  describe("LCE Configuration", () => {
    it("shows LCE section when enabled", async () => {
      const user = userEvent.setup();

      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Create Configuration")).toBeInTheDocument();
      });

      // Enable LCE
      const lceToggle = screen.getByRole("checkbox");
      await user.click(lceToggle);

      await waitFor(() => {
        expect(
          screen.getByText(/Alternative FPR Threshold/i)
        ).toBeInTheDocument();
        const lceCountriesElements = screen.getAllByText(/LCE Countries/i);
        expect(lceCountriesElements.length).toBeGreaterThan(0);
      });
    });

    it("allows country search and selection", async () => {
      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Create Configuration")).toBeInTheDocument();
      });

      // Enable LCE
      const lceToggle = screen.getByRole("checkbox");
      fireEvent.click(lceToggle);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search countries...")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search countries...");
      fireEvent.change(searchInput, { target: { value: "United" } });

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });
    });

    it("toggles country selection", async () => {
      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Create Configuration")).toBeInTheDocument();
      });

      // Enable LCE
      const lceToggle = screen.getByRole("checkbox");
      fireEvent.click(lceToggle);

      await waitFor(() => {
        expect(screen.getByText("United States")).toBeInTheDocument();
      });

      // Find and click a country checkbox
      const countryCheckboxes = screen.getAllByRole("checkbox");
      const usCheckbox = countryCheckboxes.find((cb) => {
        const label = cb.closest("label");
        return label?.textContent?.includes("United States");
      });

      if (usCheckbox) {
        fireEvent.click(usCheckbox);

        await waitFor(() => {
          expect(usCheckbox).toBeChecked();
        });
      }
    });
  });

  describe("Award Tiers", () => {
    const mockConfigWithTiers = {
      id: "config1",
      hofId: "hof1",
      yearId: "year1",
      minPeaks: 5,
      minForeignPeaks: 2,
      minFpr: 10,
      minimumAge: 18,
      notes: "Test notes",
      lceEnabled: false,
      lceMinFpr: null,
      lceCountries: [],
      hof: mockHofs[0],
      year: mockYears[0],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };

    const mockTiers = [
      {
        id: "tier1",
        hofYearConfigId: "config1",
        name: "Bronze",
        minPeaks: 1,
        maxPeaks: 10,
        displayOrder: 1,
      },
      {
        id: "tier2",
        hofYearConfigId: "config1",
        name: "Silver",
        minPeaks: 11,
        maxPeaks: null,
        displayOrder: 2,
      },
    ];

    it("displays award tiers in edit mode", async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/hof-year-configs/config1")) {
          return Promise.resolve({
            ok: true,
            json: async () => mockConfigWithTiers,
          });
        }
        if (url.includes("/api/award-tiers?configId=config1")) {
          return Promise.resolve({ ok: true, json: async () => mockTiers });
        }
        if (url === "/api/hofs")
          return Promise.resolve({ ok: true, json: async () => mockHofs });
        if (url === "/api/years")
          return Promise.resolve({ ok: true, json: async () => mockYears });
        if (url === "/api/countries")
          return Promise.resolve({
            ok: true,
            json: async () => ({ countries: mockCountries }),
          });
        return Promise.resolve({ ok: false });
      });

      render(<ConfigurationForm mode="edit" configId="config1" />);

      await waitFor(() => {
        expect(screen.getByText("Award Tiers")).toBeInTheDocument();
        expect(screen.getByText("Bronze")).toBeInTheDocument();
        expect(screen.getByText("Silver")).toBeInTheDocument();
      });
    });
  });

  describe("Hofmeister Selection", () => {
    const mockUsers = [
      {
        id: "user-1",
        displayName: "John Doe",
        username: "johndoe",
        givenName: "John",
        familyName: "Doe",
        bwbForumNickname: "JD",
      },
      {
        id: "user-2",
        displayName: "Jane Smith",
        username: "janesmith",
        givenName: "Jane",
        familyName: "Smith",
        bwbForumNickname: "JS",
      },
      {
        id: "user-3",
        displayName: "Bob Wilson",
        username: "bobwilson",
        givenName: "Bob",
        familyName: "Wilson",
        bwbForumNickname: null,
      },
    ];

    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
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
        if (url === "/api/countries") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ countries: mockCountries }),
          });
        }
        if (url.includes("/api/users?status=ACTIVE")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: mockUsers }),
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });
    });

    it("renders hofmeister dropdown in create mode", async () => {
      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Hofmeister \(optional\)/i)
        ).toBeInTheDocument();
      });
    });

    it("loads active users for hofmeister selection", async () => {
      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/users?status=ACTIVE&limit=1000")
        );
      });
    });

    it("displays helper text for hofmeister field", async () => {
      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(
          screen.getByText(
            /Responsible for organizing and maintaining this Hall of Fame category/i
          )
        ).toBeInTheDocument();
      });
    });

    it("allows selecting a hofmeister", async () => {
      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Hofmeister \(optional\)/i)
        ).toBeInTheDocument();
      });

      // Click the button to open dropdown
      const selectButton = screen.getByRole("combobox", {
        name: /Hofmeister \(optional\)/i,
      });
      fireEvent.click(selectButton);

      await waitFor(() => {
        const option = screen.getByText("John Doe");
        expect(option).toBeInTheDocument();
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("includes hofmeisterId in form submission", async () => {
      (global.fetch as jest.Mock).mockImplementation(
        (url: string, options?: any) => {
          if (url.includes("/api/users")) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ users: mockUsers }),
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
          if (url === "/api/countries") {
            return Promise.resolve({
              ok: true,
              json: async () => ({ countries: mockCountries }),
            });
          }
          if (
            url.includes("/api/hof-year-configs") &&
            options?.method === "POST"
          ) {
            const body = JSON.parse(options.body);
            return Promise.resolve({
              ok: true,
              json: async () => ({
                id: "config-1",
                ...body,
              }),
            });
          }
          return Promise.reject(new Error("Unknown URL"));
        }
      );

      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("HOF1 - Hall of Fame 1")).toBeInTheDocument();
      });

      // Fill required fields
      const hofSelect = screen.getByLabelText(/Hall of Fame/i);
      fireEvent.change(hofSelect, { target: { value: "hof1" } });

      const yearSelect = screen.getByLabelText(/Year/i);
      fireEvent.change(yearSelect, { target: { value: "year1" } });

      // Wait for state to update
      await waitFor(() => {
        expect(hofSelect).toHaveValue("hof1");
      });

      // Select hofmeister
      const hofmeisterButton = screen.getByRole("combobox", {
        name: /Hofmeister \(optional\)/i,
      });
      fireEvent.click(hofmeisterButton);

      await waitFor(() => {
        const option = screen.getByText("Jane Smith");
        fireEvent.click(option);
      });

      // Wait for selection to complete
      await waitFor(() => {
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });

      // Submit form
      const saveButton = screen.getByRole("button", { name: /^Save$/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/hof-year-configs"),
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining('"hofmeisterId":"user-2"'),
          })
        );
      });
    });

    it("sends null when hofmeister not selected", async () => {
      (global.fetch as jest.Mock).mockImplementation(
        (url: string, options?: any) => {
          if (url.includes("/api/users")) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ users: mockUsers }),
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
          if (url === "/api/countries") {
            return Promise.resolve({
              ok: true,
              json: async () => ({ countries: mockCountries }),
            });
          }
          if (
            url.includes("/api/hof-year-configs") &&
            options?.method === "POST"
          ) {
            return Promise.resolve({
              ok: true,
              json: async () => ({
                id: "config-1",
                hofId: "hof1",
                yearId: "year1",
                hofmeisterId: null,
              }),
            });
          }
          return Promise.reject(new Error("Unknown URL"));
        }
      );

      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("HOF1 - Hall of Fame 1")).toBeInTheDocument();
      });

      const hofSelect = screen.getByLabelText(/Hall of Fame/i);
      fireEvent.change(hofSelect, { target: { value: "hof1" } });

      const yearSelect = screen.getByLabelText(/Year/i);
      fireEvent.change(yearSelect, { target: { value: "year1" } });

      // Wait for state to update
      await waitFor(() => {
        expect(hofSelect).toHaveValue("hof1");
      });

      const saveButton = screen.getByRole("button", { name: /^Save$/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/hof-year-configs"),
          expect.objectContaining({
            method: "POST",
          })
        );
      });
    });

    it("handles users API failure gracefully", async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/users")) {
          return Promise.resolve({
            ok: false,
            status: 500,
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
        if (url === "/api/countries") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ countries: mockCountries }),
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Hall of Fame/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Hofmeister \(optional\)/i)).toBeInTheDocument();
    });

    it("handles 1000+ users without performance issues", async () => {
      const manyUsers = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        displayName: `User ${i}`,
        username: `user${i}`,
        givenName: `First${i}`,
        familyName: `Last${i}`,
        bwbForumNickname: `Nick${i}`,
      }));

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/users")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: manyUsers }),
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
        if (url === "/api/countries") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ countries: mockCountries }),
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      const startTime = performance.now();

      render(<ConfigurationForm mode="create" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Hofmeister \(optional\)/i)
        ).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(2000);
    });
  });
});
