import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import YearForm from "@/app/components/features/years/YearForm";

// Mock next/navigation
const mockPush = jest.fn();
const mockGet = jest.fn(() => null);

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

global.fetch = jest.fn();

const mockYear = {
  id: "year-1",
  code: "2024",
  title: "2024 Year",
  description: "Year 2024 description",
  isActive: true,
  displayOrder: 1,
  allowManualEntry: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("YearForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({}),
      })
    );
  });

  describe("Create Mode", () => {
    it("renders create form", () => {
      render(<YearForm mode="create" />);
      expect(screen.getByText("Create Year")).toBeInTheDocument();
      expect(screen.getByText("Add a new year")).toBeInTheDocument();
    });

    it("shows required field indicators", () => {
      render(<YearForm mode="create" />);
      const requiredAsterisks = screen.getAllByText("*");
      expect(requiredAsterisks.length).toBeGreaterThan(0);
    });

    it("validates code field", async () => {
      const user = userEvent.setup();
      render(<YearForm mode="create" />);

      const codeInput = screen.getByPlaceholderText(/e.g., 2025, 2026/);
      await user.type(codeInput, "2");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Code must be at least 2 characters/)
        ).toBeInTheDocument();
      });
    });

    it("validates title field", async () => {
      const user = userEvent.setup();
      render(<YearForm mode="create" />);

      const titleInput = screen.getByPlaceholderText(/e.g., 2025 Year/);
      await user.type(titleInput, "A");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/Title must be at least 2 characters/)
        ).toBeInTheDocument();
      });
    });

    it("submits create form successfully", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockYear,
        })
      );

      render(<YearForm mode="create" />);

      const codeInput = screen.getByPlaceholderText(/e.g., 2025, 2026/);
      const titleInput = screen.getByPlaceholderText(/e.g., 2025 Year/);

      await user.type(codeInput, "2025");
      await user.type(titleInput, "2025 Year");
      await user.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(
          screen.getByText(/Year created successfully/)
        ).toBeInTheDocument();
      });
    });

    it("toggles active status", async () => {
      const user = userEvent.setup();
      render(<YearForm mode="create" />);

      const activeCheckbox = screen.getByLabelText("Active Status");
      expect(activeCheckbox).toBeChecked();

      await user.click(activeCheckbox);
      expect(activeCheckbox).not.toBeChecked();
    });

    it("toggles allow manual entry", async () => {
      const user = userEvent.setup();
      render(<YearForm mode="create" />);

      const manualEntryCheckbox = screen.getByLabelText(
        "Allow Manual Data Entry"
      );
      expect(manualEntryCheckbox).toBeChecked();

      await user.click(manualEntryCheckbox);
      expect(manualEntryCheckbox).not.toBeChecked();
    });

    it("handles cancel button", async () => {
      const user = userEvent.setup();
      render(<YearForm mode="create" />);

      await user.click(screen.getByText("Cancel"));

      expect(mockPush).toHaveBeenCalledWith("/admin/years");
    });
  });

  describe("Edit Mode", () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/years/year-1")) {
          return Promise.resolve({
            ok: true,
            json: async () => mockYear,
          });
        }
        if (url.includes("/api/hof-year-configs")) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url.includes("/api/award-tiers")) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Not found" }),
        });
      });
    });

    it("renders edit form with loading state", () => {
      render(<YearForm mode="edit" yearId="year-1" />);
      expect(screen.getByText("Loading year...")).toBeInTheDocument();
    });

    it("loads existing year data", async () => {
      render(<YearForm mode="edit" yearId="year-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Year")).toBeInTheDocument();
      });

      const codeInput = screen.getByDisplayValue("2024");
      expect(codeInput).toBeInTheDocument();

      const titleInput = screen.getByDisplayValue("2024 Year");
      expect(titleInput).toBeInTheDocument();
    });

    it("shows delete button in edit mode", async () => {
      render(<YearForm mode="edit" yearId="year-1" />);

      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });
    });

    it("opens delete confirmation dialog", async () => {
      const user = userEvent.setup();
      render(<YearForm mode="edit" yearId="year-1" />);

      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(
          screen.getByText(/Are you sure you want to delete/)
        ).toBeInTheDocument();
      });
    });

    it("submits edit form successfully", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation(
        (url: string, options?: any) => {
          if (url.includes("/api/years/year-1") && options?.method === "PUT") {
            return Promise.resolve({
              ok: true,
              json: async () => mockYear,
            });
          }
          if (url.includes("/api/years/year-1")) {
            return Promise.resolve({
              ok: true,
              json: async () => mockYear,
            });
          }
          if (url.includes("/api/hof-year-configs")) {
            return Promise.resolve({
              ok: true,
              json: async () => [],
            });
          }
          if (url.includes("/api/award-tiers")) {
            return Promise.resolve({
              ok: true,
              json: async () => [],
            });
          }
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: "Not found" }),
          });
        }
      );

      render(<YearForm mode="edit" yearId="year-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Year")).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue("2024 Year");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated 2024 Year");
      await user.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(
          screen.getByText(/Year updated successfully/)
        ).toBeInTheDocument();
      });
    });

    it("handles delete operation", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation(
        (url: string, options?: any) => {
          if (
            url.includes("/api/years/year-1") &&
            options?.method === "DELETE"
          ) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true }),
            });
          }
          if (url.includes("/api/years/year-1")) {
            return Promise.resolve({
              ok: true,
              json: async () => mockYear,
            });
          }
          if (url.includes("/api/hof-year-configs")) {
            return Promise.resolve({
              ok: true,
              json: async () => [],
            });
          }
          if (url.includes("/api/award-tiers")) {
            return Promise.resolve({
              ok: true,
              json: async () => [],
            });
          }
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: "Not found" }),
          });
        }
      );

      render(<YearForm mode="edit" yearId="year-1" />);

      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Delete"));

      await waitFor(() => {
        const confirmButton = screen
          .getAllByText("Delete")
          .find((el) => el.closest("button")?.className.includes("danger"));
        if (confirmButton) {
          user.click(confirmButton);
        }
      });
    });

    it("updates display order", async () => {
      const user = userEvent.setup();
      render(<YearForm mode="edit" yearId="year-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText("Display Order")).toBeInTheDocument();
      });

      const displayOrderInput = screen.getByLabelText("Display Order");
      await user.clear(displayOrderInput);
      await user.type(displayOrderInput, "5");

      expect(displayOrderInput).toHaveValue(5);
    });
  });

  it("handles API errors gracefully", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({ error: "Server error" }),
      })
    );

    render(<YearForm mode="create" />);

    const codeInput = screen.getByPlaceholderText(/e.g., 2025, 2026/);
    const titleInput = screen.getByPlaceholderText(/e.g., 2025 Year/);

    await user.type(codeInput, "2025");
    await user.type(titleInput, "2025 Year");
    await user.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("updates description with markdown support", async () => {
    const user = userEvent.setup();
    render(<YearForm mode="create" />);

    const descriptionTextarea = screen.getByPlaceholderText(
      /Optional description of this year/
    );
    await user.type(descriptionTextarea, "**Bold** description");

    expect(descriptionTextarea).toHaveValue("**Bold** description");
  });
});
