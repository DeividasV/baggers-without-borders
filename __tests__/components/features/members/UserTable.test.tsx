import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { useRouter } from "next/navigation";
import UserTable from "@/app/components/features/members/UserTable";
import type { User } from "@/src/types/user-management";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("UserTable Component", () => {
  const mockUser1: User = {
    id: "1",
    displayName: "johndoe",
    username: "johndoe",
    role: "USER",
    givenName: "John",
    familyName: "Doe",
    email: "john@example.com",
    status: "ACTIVE",
    residenceCountry: {
      code: "US",
      name: "United States",
    },
    forumJoinDate: "2024-01-15T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const mockUser2: User = {
    id: "2",
    displayName: "janedoe",
    username: "janedoe",
    role: "USER",
    givenName: "Jane",
    familyName: "Smith",
    email: "jane@example.com",
    status: "NEW",
    residenceCountry: {
      code: "CA",
      name: "Canada",
    },
    forumJoinDate: "2024-02-01T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const mockUser3: User = {
    id: "3",
    displayName: "inactiveuser",
    username: "inactiveuser",
    role: "USER",
    email: "inactive@example.com",
    status: "INACTIVE",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const currentParams = new URLSearchParams("page=1&sortBy=name");

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    } as any);
    jest.clearAllMocks();
  });

  describe("Table Structure", () => {
    it("should render table element", () => {
      const { container } = render(
        <UserTable users={[mockUser1]} currentParams={currentParams} />,
      );
      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should render table headers", () => {
      render(<UserTable users={[mockUser1]} currentParams={currentParams} />);
      expect(screen.getByText("Given Name")).toBeInTheDocument();
      expect(screen.getByText("Family Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Residence")).toBeInTheDocument();
      expect(screen.getByText("Since")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
    });

    it("should render tbody element", () => {
      const { container } = render(
        <UserTable users={[mockUser1]} currentParams={currentParams} />,
      );
      expect(container.querySelector("tbody")).toBeInTheDocument();
    });

    it("should have fixed table layout", () => {
      const { container } = render(
        <UserTable users={[mockUser1]} currentParams={currentParams} />,
      );
      const table = container.querySelector("table");
      expect(table).toHaveClass("table-fixed");
    });

    it("should have column width definitions", () => {
      const { container } = render(
        <UserTable users={[mockUser1]} currentParams={currentParams} />,
      );
      const colgroup = container.querySelector("colgroup");
      expect(colgroup).toBeInTheDocument();
      expect(colgroup?.querySelectorAll("col")).toHaveLength(6);
    });
  });

  describe("Rendering Users", () => {
    it("should render all users as table rows", () => {
      const { container } = render(
        <UserTable
          users={[mockUser1, mockUser2, mockUser3]}
          currentParams={currentParams}
        />,
      );
      const tbody = container.querySelector("tbody");
      expect(tbody?.querySelectorAll("tr")).toHaveLength(3);
    });

    it("should render empty table body when no users", () => {
      const { container } = render(
        <UserTable users={[]} currentParams={currentParams} />,
      );
      const tbody = container.querySelector("tbody");
      expect(tbody?.querySelectorAll("tr")).toHaveLength(0);
    });

    it("should display given name", () => {
      render(<UserTable users={[mockUser1]} currentParams={currentParams} />);
      expect(screen.getByText("John")).toBeInTheDocument();
    });

    it("should display family name", () => {
      render(<UserTable users={[mockUser1]} currentParams={currentParams} />);
      expect(screen.getByText("Doe")).toBeInTheDocument();
    });

    it("should display email", () => {
      render(<UserTable users={[mockUser1]} currentParams={currentParams} />);
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("should display residence country code", () => {
      render(<UserTable users={[mockUser1]} currentParams={currentParams} />);
      expect(screen.getByText("US")).toBeInTheDocument();
    });

    it("should display formatted join date", () => {
      render(<UserTable users={[mockUser1]} currentParams={currentParams} />);
      expect(screen.getByText("2024-01-15")).toBeInTheDocument();
    });
  });

  describe("Empty Field Handling", () => {
    it("should show em dash when givenName is missing", () => {
      const userNoGivenName = { ...mockUser1, givenName: undefined };
      render(
        <UserTable users={[userNoGivenName]} currentParams={currentParams} />,
      );
      const cells = screen.getAllByText("—");
      expect(cells.length).toBeGreaterThan(0);
    });

    it("should show em dash when familyName is missing", () => {
      const userNoFamilyName = { ...mockUser1, familyName: undefined };
      render(
        <UserTable users={[userNoFamilyName]} currentParams={currentParams} />,
      );
      const cells = screen.getAllByText("—");
      expect(cells.length).toBeGreaterThan(0);
    });

    it("should show em dash when email is missing", () => {
      const userNoEmail = { ...mockUser1, email: undefined };
      render(<UserTable users={[userNoEmail]} currentParams={currentParams} />);
      const cells = screen.getAllByText("—");
      expect(cells.length).toBeGreaterThan(0);
    });

    it("should show em dash when residence country is missing", () => {
      const userNoCountry = { ...mockUser1, residenceCountry: undefined };
      render(
        <UserTable users={[userNoCountry]} currentParams={currentParams} />,
      );
      const cells = screen.getAllByText("—");
      expect(cells.length).toBeGreaterThan(0);
    });

    it("should show em dash when forum join date is missing", () => {
      const userNoDate = { ...mockUser1, forumJoinDate: undefined };
      render(<UserTable users={[userNoDate]} currentParams={currentParams} />);
      const cells = screen.getAllByText("—");
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe("Status Badges", () => {
    it("should display ACTIVE status badge", () => {
      render(<UserTable users={[mockUser1]} currentParams={currentParams} />);
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should display NEW status badge", () => {
      render(<UserTable users={[mockUser2]} currentParams={currentParams} />);
      expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("should display INACTIVE status badge", () => {
      render(<UserTable users={[mockUser3]} currentParams={currentParams} />);
      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });

    it("should apply green styling to ACTIVE status", () => {
      render(<UserTable users={[mockUser1]} currentParams={currentParams} />);
      const badge = screen.getByText("Active");
      expect(badge).toHaveClass("bg-green-900/30", "text-green-400");
    });

    it("should apply blue styling to NEW status", () => {
      render(<UserTable users={[mockUser2]} currentParams={currentParams} />);
      const badge = screen.getByText("New");
      expect(badge).toHaveClass("bg-blue-900/30", "text-blue-400");
    });

    it("should apply gray styling to INACTIVE status", () => {
      render(<UserTable users={[mockUser3]} currentParams={currentParams} />);
      const badge = screen.getByText("Inactive");
      expect(badge).toHaveClass("bg-gray-900/30", "text-gray-400");
    });

    it("should capitalize status text correctly", () => {
      render(
        <UserTable
          users={[mockUser1, mockUser2, mockUser3]}
          currentParams={currentParams}
        />,
      );
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("New")).toBeInTheDocument();
      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should navigate to user profile on row click", () => {
      render(<UserTable users={[mockUser1]} currentParams={currentParams} />);
      const row = screen.getByText("John").closest("tr");
      fireEvent.click(row!);
      expect(mockPush).toHaveBeenCalledWith(
        `/admin/members/1?returnTo=${encodeURIComponent(
          "/admin/members?page=1&sortBy=name",
        )}`,
      );
    });

    it("should encode returnTo URL parameter correctly", () => {
      const params = new URLSearchParams("filter=active&search=test");
      render(<UserTable users={[mockUser1]} currentParams={params} />);
      const row = screen.getByText("John").closest("tr");
      fireEvent.click(row!);
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining(
          encodeURIComponent("/admin/members?filter=active&search=test"),
        ),
      );
    });

    it("should navigate with correct user ID", () => {
      render(<UserTable users={[mockUser2]} currentParams={currentParams} />);
      const row = screen.getByText("Jane").closest("tr");
      fireEvent.click(row!);
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/admin/members/2"),
      );
    });

    it("should preserve current params in returnTo", () => {
      const params = new URLSearchParams("page=2&sortBy=email&order=desc");
      render(<UserTable users={[mockUser1]} currentParams={params} />);
      const row = screen.getByText("John").closest("tr");
      fireEvent.click(row!);
      const callArg = mockPush.mock.calls[0][0];
      const decodedUrl = decodeURIComponent(callArg);
      expect(decodedUrl).toContain("page=2");
      expect(decodedUrl).toContain("sortBy=email");
      expect(decodedUrl).toContain("order=desc");
    });

    it("should handle clicking different rows", () => {
      render(
        <UserTable
          users={[mockUser1, mockUser2]}
          currentParams={currentParams}
        />,
      );

      const row1 = screen.getByText("John").closest("tr");
      fireEvent.click(row1!);
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/admin/members/1"),
      );

      const row2 = screen.getByText("Jane").closest("tr");
      fireEvent.click(row2!);
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/admin/members/2"),
      );
    });
  });

  describe("Styling and Interactivity", () => {
    it("should apply cursor-pointer to table rows", () => {
      const { container } = render(
        <UserTable users={[mockUser1]} currentParams={currentParams} />,
      );
      const row = container.querySelector("tbody tr");
      expect(row).toHaveClass("cursor-pointer");
    });

    it("should apply hover styles to rows", () => {
      const { container } = render(
        <UserTable users={[mockUser1]} currentParams={currentParams} />,
      );
      const row = container.querySelector("tbody tr");
      expect(row).toHaveClass("hover:bg-dark-800");
    });

    it("should apply transition to rows", () => {
      const { container } = render(
        <UserTable users={[mockUser1]} currentParams={currentParams} />,
      );
      const row = container.querySelector("tbody tr");
      expect(row).toHaveClass("transition-colors");
    });

    it("should truncate long text in cells", () => {
      const { container } = render(
        <UserTable users={[mockUser1]} currentParams={currentParams} />,
      );
      const nameSpans = container.querySelectorAll("td span.text-white");
      nameSpans.forEach((span) => {
        expect(span).toHaveClass("truncate");
      });
    });

    it("should hide on mobile (show only on md+)", () => {
      const { container } = render(
        <UserTable users={[mockUser1]} currentParams={currentParams} />,
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("hidden", "md:block");
    });
  });

  describe("Text Formatting", () => {
    it("should apply white color to names", () => {
      const { container } = render(
        <UserTable users={[mockUser1]} currentParams={currentParams} />,
      );
      const johnCell = screen.getByText("John").closest("span");
      const doeCell = screen.getByText("Doe").closest("span");
      expect(johnCell).toHaveClass("text-white");
      expect(doeCell).toHaveClass("text-white");
    });

    it("should apply gray color to email", () => {
      render(<UserTable users={[mockUser1]} currentParams={currentParams} />);
      const emailCell = screen.getByText("john@example.com").closest("span");
      expect(emailCell).toHaveClass("text-gray-400");
    });

    it("should apply small text size to email", () => {
      render(<UserTable users={[mockUser1]} currentParams={currentParams} />);
      const emailCell = screen.getByText("john@example.com").closest("span");
      expect(emailCell).toHaveClass("text-sm");
    });

    it("should apply gray styling to header cells", () => {
      const { container } = render(
        <UserTable
          users={[mockUser1]}
          currentParams={currentParams}
          sortBy=""
          sortOrder="asc"
          onSort={() => {}}
        />,
      );
      const headerButtons = container.querySelectorAll("th button");
      headerButtons.forEach((button) => {
        expect(button).toHaveClass("text-gray-400");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty strings for names", () => {
      const userEmptyNames = {
        ...mockUser1,
        givenName: "",
        familyName: "",
      };
      render(
        <UserTable users={[userEmptyNames]} currentParams={currentParams} />,
      );
      const cells = screen.getAllByText("—");
      expect(cells.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle special characters in names", () => {
      const userSpecialChars = {
        ...mockUser1,
        givenName: "O'Brien",
        familyName: "Müller-Schmidt",
      };
      render(
        <UserTable users={[userSpecialChars]} currentParams={currentParams} />,
      );
      expect(screen.getByText("O'Brien")).toBeInTheDocument();
      expect(screen.getByText("Müller-Schmidt")).toBeInTheDocument();
    });

    it("should handle very long email addresses", () => {
      const userLongEmail = {
        ...mockUser1,
        email: "verylongemailaddress@verylongdomainname.example.com",
      };
      render(
        <UserTable users={[userLongEmail]} currentParams={currentParams} />,
      );
      expect(
        screen.getByText("verylongemailaddress@verylongdomainname.example.com"),
      ).toBeInTheDocument();
    });

    it("should handle multiple users with same status", () => {
      const users = [
        mockUser1,
        { ...mockUser1, id: "10", givenName: "Bob" },
        { ...mockUser1, id: "11", givenName: "Alice" },
      ];
      render(<UserTable users={users} currentParams={currentParams} />);
      const activeBadges = screen.getAllByText("Active");
      expect(activeBadges).toHaveLength(3);
    });

    it("should handle empty URLSearchParams", () => {
      const emptyParams = new URLSearchParams();
      render(<UserTable users={[mockUser1]} currentParams={emptyParams} />);
      const row = screen.getByText("John").closest("tr");
      fireEvent.click(row!);
      expect(mockPush).toHaveBeenCalled();
    });

    it("should handle null country object gracefully", () => {
      const userNullCountry = { ...mockUser1, residenceCountry: null as any };
      render(
        <UserTable users={[userNullCountry]} currentParams={currentParams} />,
      );
      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });
  });

  describe("Multiple Users", () => {
    it("should render correct number of rows", () => {
      const users = [mockUser1, mockUser2, mockUser3];
      const { container } = render(
        <UserTable users={users} currentParams={currentParams} />,
      );
      const rows = container.querySelectorAll("tbody tr");
      expect(rows).toHaveLength(3);
    });

    it("should display all users with their correct data", () => {
      const users = [mockUser1, mockUser2];
      render(<UserTable users={users} currentParams={currentParams} />);
      expect(screen.getByText("John")).toBeInTheDocument();
      expect(screen.getByText("Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane")).toBeInTheDocument();
      expect(screen.getByText("Smith")).toBeInTheDocument();
    });

    it("should maintain row order", () => {
      const users = [mockUser1, mockUser2, mockUser3];
      const { container } = render(
        <UserTable users={users} currentParams={currentParams} />,
      );
      const rows = container.querySelectorAll("tbody tr");

      expect(
        within(rows[0] as HTMLElement).getByText("John"),
      ).toBeInTheDocument();
      expect(
        within(rows[1] as HTMLElement).getByText("Jane"),
      ).toBeInTheDocument();
      expect(
        within(rows[2] as HTMLElement).getByText("inactive@example.com"),
      ).toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("should format dates in YYYY-MM-DD format", () => {
      render(<UserTable users={[mockUser1]} currentParams={currentParams} />);
      expect(screen.getByText("2024-01-15")).toBeInTheDocument();
    });

    it("should format different dates correctly", () => {
      render(<UserTable users={[mockUser2]} currentParams={currentParams} />);
      expect(screen.getByText("2024-02-01")).toBeInTheDocument();
    });

    it("should handle date edge cases", () => {
      const userWithDate = {
        ...mockUser1,
        forumJoinDate: "2023-12-31T00:00:00.000Z",
      };
      render(
        <UserTable users={[userWithDate]} currentParams={currentParams} />,
      );
      expect(screen.getByText(/2023-12-(30|31)/)).toBeInTheDocument();
    });
  });
});
