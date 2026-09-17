import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import UserStats from "@/app/components/features/members/UserStats";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/app/components/ui/StatsCard", () => {
  return function MockStatsCard({ icon: Icon, value, label }: any) {
    return (
      <div data-testid="stats-card">
        {Icon && <Icon data-testid={`icon-${label.toLowerCase()}`} />}
        <div data-testid={`value-${label.toLowerCase()}`}>{value}</div>
        <div data-testid={`label-${label.toLowerCase()}`}>{label}</div>
      </div>
    );
  };
});

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("UserStats Component", () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    } as any);
    jest.clearAllMocks();
  });

  const defaultStats = {
    activeCount: 50,
    adminCount: 5,
  };

  describe("Basic Rendering", () => {
    it("should render stats cards", () => {
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getAllByTestId("stats-card")).toHaveLength(3);
    });

    it("should render total count", () => {
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getByTestId("value-total")).toHaveTextContent("100");
    });

    it("should render active count", () => {
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getByTestId("value-active")).toHaveTextContent("50");
    });

    it("should render admin count", () => {
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getByTestId("value-admins")).toHaveTextContent("5");
    });

    it("should render correct labels", () => {
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getByTestId("label-total")).toHaveTextContent("Total");
      expect(screen.getByTestId("label-active")).toHaveTextContent("Active");
      expect(screen.getByTestId("label-admins")).toHaveTextContent("Admins");
    });
  });

  describe("Number Formatting", () => {
    it("should format large numbers", () => {
      render(
        <UserStats
          totalCount={1234}
          stats={{ activeCount: 5678, adminCount: 90 }}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getByTestId("value-total")).toHaveTextContent(/1\s234/);
      expect(screen.getByTestId("value-active")).toHaveTextContent(/5\s678/);
    });

    it("should handle zero values", () => {
      render(
        <UserStats
          totalCount={0}
          stats={{ activeCount: 0, adminCount: 0 }}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getByTestId("value-total")).toHaveTextContent("0");
      expect(screen.getByTestId("value-active")).toHaveTextContent("0");
      expect(screen.getByTestId("value-admins")).toHaveTextContent("0");
    });

    it("should handle single digit numbers", () => {
      render(
        <UserStats
          totalCount={5}
          stats={{ activeCount: 3, adminCount: 1 }}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getByTestId("value-total")).toHaveTextContent("5");
      expect(screen.getByTestId("value-active")).toHaveTextContent("3");
      expect(screen.getByTestId("value-admins")).toHaveTextContent("1");
    });
  });

  describe("Management Buttons", () => {
    it("should render Manage Interests button", () => {
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getByText("Manage Interests")).toBeInTheDocument();
    });

    it("should render Manage Consents button", () => {
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getByText("Manage Consents")).toBeInTheDocument();
    });

    it("should render Create Member button", () => {
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getByText("Create Member")).toBeInTheDocument();
    });

    it("should navigate to interests page on Manage Interests click", () => {
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      fireEvent.click(screen.getByText("Manage Interests"));
      expect(mockPush).toHaveBeenCalledWith("/admin/interests");
    });

    it("should navigate to consent types page on Manage Consents click", () => {
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      fireEvent.click(screen.getByText("Manage Consents"));
      expect(mockPush).toHaveBeenCalledWith("/admin/consent-types");
    });

    it("should call onCreateClick when Create Member is clicked", () => {
      const onCreateClick = jest.fn();
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={onCreateClick}
        />
      );
      fireEvent.click(screen.getByText("Create Member"));
      expect(onCreateClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Button Styling", () => {
    it("should apply secondary button style to management buttons", () => {
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      const interestsButton = screen
        .getByText("Manage Interests")
        .closest("button");
      const consentsButton = screen
        .getByText("Manage Consents")
        .closest("button");
      expect(interestsButton).toHaveClass("btn-secondary");
      expect(consentsButton).toHaveClass("btn-secondary");
    });

    it("should apply primary button style to Create Member button", () => {
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      const createButton = screen.getByText("Create Member").closest("button");
      expect(createButton).toHaveClass("btn-primary");
    });
  });

  describe("Icons", () => {
    it("should render Heart icon for Manage Interests", () => {
      const { container } = render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      const heartIcon = container.querySelector(".lucide-heart");
      expect(heartIcon).toBeInTheDocument();
    });

    it("should render ShieldCheck icon for Manage Consents", () => {
      const { container } = render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      const shieldIcon = container.querySelector(".lucide-shield-check");
      expect(shieldIcon).toBeInTheDocument();
    });

    it("should render Plus icon for Create Member", () => {
      const { container } = render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      const plusIcon = container.querySelector(".lucide-plus");
      expect(plusIcon).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("should render stats card container", () => {
      const { container } = render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      const cardDiv = container.querySelector(".card.bg-dark-800");
      expect(cardDiv).toBeInTheDocument();
    });

    it("should use grid layout for stats cards", () => {
      const { container } = render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      const grid = container.querySelector(".grid.grid-cols-3");
      expect(grid).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large numbers", () => {
      render(
        <UserStats
          totalCount={999999}
          stats={{ activeCount: 888888, adminCount: 777 }}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getByTestId("value-total")).toHaveTextContent(/999\s999/);
    });

    it("should handle negative numbers gracefully", () => {
      render(
        <UserStats
          totalCount={-1}
          stats={{ activeCount: -5, adminCount: -2 }}
          onCreateClick={jest.fn()}
        />
      );
      expect(screen.getByTestId("value-total")).toBeInTheDocument();
    });

    it("should handle multiple rapid clicks", () => {
      const onCreateClick = jest.fn();
      render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={onCreateClick}
        />
      );
      const createButton = screen.getByText("Create Member");

      fireEvent.click(createButton);
      fireEvent.click(createButton);
      fireEvent.click(createButton);

      expect(onCreateClick).toHaveBeenCalledTimes(3);
    });
  });

  describe("Responsive Layout", () => {
    it("should have responsive gap classes", () => {
      const { container } = render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      const grid = container.querySelector(".gap-4.sm\\:gap-6");
      expect(grid).toBeInTheDocument();
    });

    it("should have responsive flex direction", () => {
      const { container } = render(
        <UserStats
          totalCount={100}
          stats={defaultStats}
          onCreateClick={jest.fn()}
        />
      );
      const flexContainer = container.querySelector(".flex-col.sm\\:flex-row");
      expect(flexContainer).toBeInTheDocument();
    });
  });
});
