import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import UserCardList from "@/app/components/features/members/UserCardList";
import type { User } from "@/src/types/user-management";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("UserCardList Component", () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    } as any);
    jest.clearAllMocks();
  });

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
    familyName: "Doe",
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

  const currentParams = new URLSearchParams("page=1&perPage=10");

  describe("Rendering Users", () => {
    it("should render all users", () => {
      render(
        <UserCardList
          users={[mockUser1, mockUser2]}
          currentParams={currentParams}
        />
      );
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    it("should render empty when no users", () => {
      const { container } = render(
        <UserCardList users={[]} currentParams={currentParams} />
      );
      const cards = container.querySelectorAll(".bg-dark-800");
      expect(cards).toHaveLength(0);
    });

    it("should display full name from givenName and familyName", () => {
      render(
        <UserCardList users={[mockUser1]} currentParams={currentParams} />
      );
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should fallback to displayName when givenName/familyName missing", () => {
      render(
        <UserCardList users={[mockUser3]} currentParams={currentParams} />
      );
      expect(screen.getByText("inactiveuser")).toBeInTheDocument();
    });

    it("should show only given name when familyName missing", () => {
      const userOnlyGiven = { ...mockUser1, familyName: undefined };
      render(
        <UserCardList users={[userOnlyGiven]} currentParams={currentParams} />
      );
      expect(screen.getByText("John")).toBeInTheDocument();
    });

    it("should show only family name when givenName missing", () => {
      const userOnlyFamily = { ...mockUser1, givenName: undefined };
      render(
        <UserCardList users={[userOnlyFamily]} currentParams={currentParams} />
      );
      expect(screen.getByText("Doe")).toBeInTheDocument();
    });
  });

  describe("Status Badges", () => {
    it("should display ACTIVE status badge", () => {
      render(
        <UserCardList users={[mockUser1]} currentParams={currentParams} />
      );
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should display NEW status badge", () => {
      render(
        <UserCardList users={[mockUser2]} currentParams={currentParams} />
      );
      expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("should display INACTIVE status badge", () => {
      render(
        <UserCardList users={[mockUser3]} currentParams={currentParams} />
      );
      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });

    it("should apply green styling to ACTIVE status", () => {
      const { container } = render(
        <UserCardList users={[mockUser1]} currentParams={currentParams} />
      );
      const badge = screen.getByText("Active");
      expect(badge).toHaveClass("text-green-400", "bg-green-900/30");
    });

    it("should apply blue styling to NEW status", () => {
      const { container } = render(
        <UserCardList users={[mockUser2]} currentParams={currentParams} />
      );
      const badge = screen.getByText("New");
      expect(badge).toHaveClass("text-blue-400", "bg-blue-900/30");
    });

    it("should apply gray styling to INACTIVE status", () => {
      const { container } = render(
        <UserCardList users={[mockUser3]} currentParams={currentParams} />
      );
      const badge = screen.getByText("Inactive");
      expect(badge).toHaveClass("text-gray-400", "bg-gray-900/30");
    });

    it("should format status text with capitalization", () => {
      render(
        <UserCardList users={[mockUser1]} currentParams={currentParams} />
      );
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.queryByText("ACTIVE")).not.toBeInTheDocument();
    });
  });

  describe("User Details", () => {
    it("should display email when present", () => {
      render(
        <UserCardList users={[mockUser1]} currentParams={currentParams} />
      );
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
      expect(screen.getByText("Email:")).toBeInTheDocument();
    });

    it("should not display email section when email is missing", () => {
      const userNoEmail = { ...mockUser1, email: undefined };
      render(
        <UserCardList users={[userNoEmail]} currentParams={currentParams} />
      );
      expect(screen.queryByText("Email:")).not.toBeInTheDocument();
    });

    it("should display residence country code when present", () => {
      render(
        <UserCardList users={[mockUser1]} currentParams={currentParams} />
      );
      expect(screen.getByText("US")).toBeInTheDocument();
      expect(screen.getByText("Residence:")).toBeInTheDocument();
    });

    it("should not display residence section when country missing", () => {
      const userNoCountry = { ...mockUser1, residenceCountry: undefined };
      render(
        <UserCardList users={[userNoCountry]} currentParams={currentParams} />
      );
      expect(screen.queryByText("Residence:")).not.toBeInTheDocument();
    });

    it("should display forum join date when present", () => {
      render(
        <UserCardList users={[mockUser1]} currentParams={currentParams} />
      );
      expect(screen.getByText("2024-01-15")).toBeInTheDocument();
      expect(screen.getByText("Since:")).toBeInTheDocument();
    });

    it("should not display since section when forumJoinDate missing", () => {
      const userNoDate = { ...mockUser1, forumJoinDate: undefined };
      render(
        <UserCardList users={[userNoDate]} currentParams={currentParams} />
      );
      expect(screen.queryByText("Since:")).not.toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should navigate to user profile on card click", () => {
      render(
        <UserCardList users={[mockUser1]} currentParams={currentParams} />
      );
      const card = screen.getByText("John Doe").closest(".bg-dark-800");
      fireEvent.click(card!);
      expect(mockPush).toHaveBeenCalledWith(
        "/admin/members/1?returnTo=%2Fadmin%2Fmembers%3Fpage%3D1%26perPage%3D10"
      );
    });

    it("should encode returnTo URL parameter correctly", () => {
      const params = new URLSearchParams("page=2&search=test&status=ACTIVE");
      render(<UserCardList users={[mockUser1]} currentParams={params} />);
      const card = screen.getByText("John Doe").closest(".bg-dark-800");
      fireEvent.click(card!);
      expect(mockPush).toHaveBeenCalledWith(
        "/admin/members/1?returnTo=%2Fadmin%2Fmembers%3Fpage%3D2%26search%3Dtest%26status%3DACTIVE"
      );
    });

    it("should navigate with correct user ID", () => {
      render(
        <UserCardList users={[mockUser2]} currentParams={currentParams} />
      );
      const card = screen.getByText("Jane Doe").closest(".bg-dark-800");
      fireEvent.click(card!);
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/admin/members/2")
      );
    });

    it("should preserve current params in returnTo", () => {
      const params = new URLSearchParams();
      params.set("page", "3");
      params.set("perPage", "25");
      render(<UserCardList users={[mockUser1]} currentParams={params} />);
      const card = screen.getByText("John Doe").closest(".bg-dark-800");
      fireEvent.click(card!);
      const call = mockPush.mock.calls[0][0];
      expect(call).toContain("page%3D3");
      expect(call).toContain("perPage%3D25");
    });
  });

  describe("Styling and Layout", () => {
    it("should apply cursor-pointer to cards", () => {
      const { container } = render(
        <UserCardList users={[mockUser1]} currentParams={currentParams} />
      );
      const card = container.querySelector(".cursor-pointer");
      expect(card).toBeInTheDocument();
    });

    it("should apply hover transition", () => {
      const { container } = render(
        <UserCardList users={[mockUser1]} currentParams={currentParams} />
      );
      const card = container.querySelector(".hover\\:bg-dark-750");
      expect(card).toBeInTheDocument();
    });

    it("should hide on desktop (md breakpoint)", () => {
      const { container } = render(
        <UserCardList users={[mockUser1]} currentParams={currentParams} />
      );
      const wrapper = container.querySelector(".md\\:hidden");
      expect(wrapper).toBeInTheDocument();
    });

    it("should use space-y-3 for card spacing", () => {
      const { container } = render(
        <UserCardList
          users={[mockUser1, mockUser2]}
          currentParams={currentParams}
        />
      );
      const wrapper = container.querySelector(".space-y-3");
      expect(wrapper).toBeInTheDocument();
    });

    it("should truncate long email addresses", () => {
      const userLongEmail = {
        ...mockUser1,
        email: "verylongemailaddress@example.com",
      };
      const { container } = render(
        <UserCardList users={[userLongEmail]} currentParams={currentParams} />
      );
      const emailElement = screen.getByText("verylongemailaddress@example.com");
      expect(emailElement).toHaveClass("truncate");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty given and family names", () => {
      const userNoNames = { ...mockUser1, givenName: "", familyName: "" };
      render(
        <UserCardList users={[userNoNames]} currentParams={currentParams} />
      );
      expect(screen.getByText("johndoe")).toBeInTheDocument();
    });

    it("should handle special characters in names", () => {
      const userSpecial = {
        ...mockUser1,
        givenName: "O'Brien",
        familyName: "Müller",
      };
      render(
        <UserCardList users={[userSpecial]} currentParams={currentParams} />
      );
      expect(screen.getByText("O'Brien Müller")).toBeInTheDocument();
    });

    it("should handle special characters in email", () => {
      const userSpecialEmail = { ...mockUser1, email: "user+test@example.com" };
      render(
        <UserCardList
          users={[userSpecialEmail]}
          currentParams={currentParams}
        />
      );
      expect(screen.getByText("user+test@example.com")).toBeInTheDocument();
    });

    it("should handle multiple users with same status", () => {
      const users = [mockUser1, { ...mockUser1, id: "4" }];
      render(<UserCardList users={users} currentParams={currentParams} />);
      expect(screen.getAllByText("Active")).toHaveLength(2);
    });

    it("should handle empty URLSearchParams", () => {
      const emptyParams = new URLSearchParams();
      render(<UserCardList users={[mockUser1]} currentParams={emptyParams} />);
      const card = screen.getByText("John Doe").closest(".bg-dark-800");
      fireEvent.click(card!);
      expect(mockPush).toHaveBeenCalledWith(
        "/admin/members/1?returnTo=%2Fadmin%2Fmembers%3F"
      );
    });
  });

  describe("Multiple Cards", () => {
    it("should render correct number of cards", () => {
      const { container } = render(
        <UserCardList
          users={[mockUser1, mockUser2, mockUser3]}
          currentParams={currentParams}
        />
      );
      const cards = container.querySelectorAll(".bg-dark-800.border");
      expect(cards).toHaveLength(3);
    });

    it("should handle clicking different cards", () => {
      render(
        <UserCardList
          users={[mockUser1, mockUser2]}
          currentParams={currentParams}
        />
      );

      const card1 = screen.getByText("John Doe").closest(".bg-dark-800");
      fireEvent.click(card1!);
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/admin/members/1")
      );

      const card2 = screen.getByText("Jane Doe").closest(".bg-dark-800");
      fireEvent.click(card2!);
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/admin/members/2")
      );

      expect(mockPush).toHaveBeenCalledTimes(2);
    });
  });
});
