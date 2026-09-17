import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import HofParticipationSection from "@/app/components/features/user-profile/HofParticipationSection";
import type { User } from "@/src/types";

// Mock UI components
jest.mock("@/app/components/ui/Card", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
}));

jest.mock("@/app/components/ui/Switch", () => ({
  __esModule: true,
  default: ({ id, checked, onChange, label }: any) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.checked);
    };
    return (
      <div>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={handleChange}
          data-testid={`switch-${id}`}
          aria-label={label || id}
        />
        {label && <label htmlFor={id}>{label}</label>}
      </div>
    );
  },
}));

jest.mock("@/app/components/ui/LoadingSpinner", () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

const mockUser: User = {
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  role: "USER",
  createdAt: "2019-01-01T00:00:00.000Z",
};

const mockHofParticipations = [
  {
    id: "part-1",
    enabled: true,
    hof: {
      id: "hof-1",
      code: "NH48",
      title: "New Hampshire 48",
    },
  },
  {
    id: "part-2",
    enabled: false,
    hof: {
      id: "hof-2",
      code: "ADK46",
      title: "Adirondack 46",
    },
  },
  {
    id: "part-3",
    enabled: true,
    hof: {
      id: "hof-3",
      code: "NE67",
      title: "New England 67",
    },
  },
];

describe("HofParticipationSection", () => {
  const defaultProps = {
    user: mockUser,
    isEditing: false,
    hofParticipations: mockHofParticipations,
    setHofParticipations: jest.fn(),
    loadingParticipations: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("View Mode", () => {
    it("should render the section title", () => {
      render(<HofParticipationSection {...defaultProps} />);
      expect(
        screen.getByText("Hall of Fame Participation")
      ).toBeInTheDocument();
    });

    it("should display all HOF codes in view mode", () => {
      render(<HofParticipationSection {...defaultProps} />);

      expect(screen.getByText("NH48")).toBeInTheDocument();
      expect(screen.getByText("ADK46")).toBeInTheDocument();
      expect(screen.getByText("NE67")).toBeInTheDocument();
    });

    it("should show enabled/disabled status", () => {
      render(<HofParticipationSection {...defaultProps} />);

      const enabledStatuses = screen.getAllByText("Enabled");
      const disabledStatuses = screen.getAllByText("Disabled");

      expect(enabledStatuses).toHaveLength(2);
      expect(disabledStatuses).toHaveLength(1);
    });

    it("should apply correct styling for enabled participations", () => {
      const { container } = render(
        <HofParticipationSection {...defaultProps} />
      );

      const enabledCards = container.querySelectorAll(".bg-green-900\\/20");
      expect(enabledCards.length).toBeGreaterThan(0);
    });

    it("should apply correct styling for disabled participations", () => {
      const { container } = render(
        <HofParticipationSection {...defaultProps} />
      );

      const disabledCards = container.querySelectorAll(".bg-red-900\\/20");
      expect(disabledCards.length).toBeGreaterThan(0);
    });

    it("should not show helper text in view mode", () => {
      render(<HofParticipationSection {...defaultProps} />);

      expect(
        screen.queryByText(/Control which Hall of Fame tables/)
      ).not.toBeInTheDocument();
    });
  });

  describe("Edit Mode", () => {
    const editProps = { ...defaultProps, isEditing: true };

    it("should show helper text in edit mode", () => {
      render(<HofParticipationSection {...editProps} />);

      expect(
        screen.getByText(/Control which Hall of Fame tables/)
      ).toBeInTheDocument();
    });

    it("should render switches for each HOF", () => {
      render(<HofParticipationSection {...editProps} />);

      expect(screen.getByTestId("switch-hof-hof-1")).toBeInTheDocument();
      expect(screen.getByTestId("switch-hof-hof-2")).toBeInTheDocument();
      expect(screen.getByTestId("switch-hof-hof-3")).toBeInTheDocument();
    });

    it("should display HOF titles and codes in edit mode", () => {
      render(<HofParticipationSection {...editProps} />);

      expect(screen.getByText("New Hampshire 48")).toBeInTheDocument();
      expect(screen.getByText("NH48")).toBeInTheDocument();
      expect(screen.getByText("Adirondack 46")).toBeInTheDocument();
      expect(screen.getByText("ADK46")).toBeInTheDocument();
    });

    it("should toggle participation when switch is clicked", () => {
      const setHofParticipations = jest.fn();
      render(
        <HofParticipationSection
          {...editProps}
          setHofParticipations={setHofParticipations}
        />
      );

      const switchElement = screen.getByTestId("switch-hof-hof-1");
      fireEvent.click(switchElement);

      expect(setHofParticipations).toHaveBeenCalled();
      const updatedParticipations = setHofParticipations.mock.calls[0][0];
      const firstItem = updatedParticipations.find(
        (p: any) => p.id === "part-1"
      );
      expect(firstItem.enabled).toBe(false);
    });

    it("should maintain correct switch states", () => {
      render(<HofParticipationSection {...editProps} />);

      const switch1 = screen.getByTestId(
        "switch-hof-hof-1"
      ) as HTMLInputElement;
      const switch2 = screen.getByTestId(
        "switch-hof-hof-2"
      ) as HTMLInputElement;
      const switch3 = screen.getByTestId(
        "switch-hof-hof-3"
      ) as HTMLInputElement;

      expect(switch1.checked).toBe(true);
      expect(switch2.checked).toBe(false);
      expect(switch3.checked).toBe(true);
    });

    it("should use grid layout in edit mode", () => {
      const { container } = render(<HofParticipationSection {...editProps} />);

      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner when loading", () => {
      render(
        <HofParticipationSection
          {...defaultProps}
          loadingParticipations={true}
        />
      );

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should not show HOF list when loading", () => {
      render(
        <HofParticipationSection
          {...defaultProps}
          loadingParticipations={true}
        />
      );

      expect(screen.queryByText("NH48")).not.toBeInTheDocument();
      expect(screen.queryByText("ADK46")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show message when no participations available", () => {
      render(
        <HofParticipationSection {...defaultProps} hofParticipations={[]} />
      );

      expect(
        screen.getByText("No participation data available")
      ).toBeInTheDocument();
    });

    it("should not show HOF list when empty", () => {
      render(
        <HofParticipationSection {...defaultProps} hofParticipations={[]} />
      );

      expect(screen.queryByText("NH48")).not.toBeInTheDocument();
    });
  });

  describe("Multiple Toggles", () => {
    it("should handle multiple consecutive toggles", () => {
      const setHofParticipations = jest.fn();
      render(
        <HofParticipationSection
          {...defaultProps}
          isEditing={true}
          setHofParticipations={setHofParticipations}
        />
      );

      const switch1 = screen.getByTestId("switch-hof-hof-1");
      const switch2 = screen.getByTestId("switch-hof-hof-2");

      fireEvent.click(switch1);
      fireEvent.click(switch2);

      expect(setHofParticipations).toHaveBeenCalledTimes(2);
    });

    it("should preserve other participations when toggling one", () => {
      const setHofParticipations = jest.fn();
      render(
        <HofParticipationSection
          {...defaultProps}
          isEditing={true}
          setHofParticipations={setHofParticipations}
        />
      );

      const switchElement = screen.getByTestId("switch-hof-hof-2");
      fireEvent.click(switchElement);

      const updatedParticipations = setHofParticipations.mock.calls[0][0];

      // Check that only the toggled item changed
      expect(updatedParticipations[0].enabled).toBe(true); // unchanged
      expect(updatedParticipations[1].enabled).toBe(true); // changed
      expect(updatedParticipations[2].enabled).toBe(true); // unchanged
    });
  });

  describe("Accessibility", () => {
    it("should render Card component", () => {
      render(<HofParticipationSection {...defaultProps} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("should have proper section heading", () => {
      render(<HofParticipationSection {...defaultProps} />);
      const heading = screen.getByText("Hall of Fame Participation");
      expect(heading.tagName).toBe("H3");
    });
  });

  describe("Layout Responsiveness", () => {
    it("should use responsive grid classes in view mode", () => {
      const { container } = render(
        <HofParticipationSection {...defaultProps} />
      );

      const grid = container.querySelector(".grid");
      expect(grid?.className).toMatch(/md:grid-cols-/);
      expect(grid?.className).toMatch(/lg:grid-cols-/);
    });

    it("should use responsive grid classes in edit mode", () => {
      const { container } = render(
        <HofParticipationSection {...defaultProps} isEditing={true} />
      );

      const grid = container.querySelector(".grid");
      expect(grid?.className).toMatch(/md:grid-cols-/);
      expect(grid?.className).toMatch(/lg:grid-cols-/);
    });
  });
});
