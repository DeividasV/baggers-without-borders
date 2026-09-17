import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DataEntryForm from "@/components/features/data-entry/DataEntryForm";

global.fetch = jest.fn();

describe("DataEntryForm", () => {
  const mockMembers = [
    { id: "m1", username: "user1", displayName: "User One" },
    { id: "m2", username: "user2", displayName: "User Two" },
  ];

  const mockHofs = [
    { id: "h1", code: "WBC", title: "World Big Climbing" },
    { id: "h2", code: "CHC", title: "Czech Hiking Club" },
  ];

  const mockYears = [
    { id: "y1", code: "2024", title: "2024" },
    { id: "y2", code: "2023", title: "2023" },
  ];

  const mockEntry = {
    id: "entry-1",
    memberId: "m1",
    hofId: "h1",
    yearId: "y1",
    totalPeaks: 50,
    peaksInYear: 25,
    foreignPeaks: 10,
    foreignPeaksInYear: 5,
    member: {
      id: "m1",
      username: "user1",
      displayName: "User One",
    },
    hof: mockHofs[0],
    year: mockYears[0],
    createdAt: "2024-01-01T12:00:00Z",
    updatedAt: "2024-01-01T12:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/users")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: mockMembers }),
        });
      }
      if (url.includes("/api/hofs")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockHofs,
        });
      }
      if (url.includes("/api/years")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockYears,
        });
      }
      if (url.includes("/api/hof-entries/entry-1")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockEntry,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  describe("Basic Rendering", () => {
    it("should render component", () => {
      const { container } = render(<DataEntryForm mode="create" />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Create Mode", () => {
    it("should render create form", async () => {
      render(<DataEntryForm mode="create" />);

      await waitFor(
        () => {
          expect(screen.queryByText(/Create HOF Entry/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("should fetch reference data on mount", async () => {
      render(<DataEntryForm mode="create" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/users")
        );
      });
    });
  });

  describe("Edit Mode", () => {
    it("should render edit mode", async () => {
      const { container } = render(
        <DataEntryForm mode="edit" entryId="entry-1" />
      );
      expect(container).toBeInTheDocument();
    });

    it("should fetch entry data", async () => {
      render(<DataEntryForm mode="edit" entryId="entry-1" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/hof-entries/entry-1")
        );
      });
    });
  });
});
