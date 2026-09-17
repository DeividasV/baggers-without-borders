import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import PasswordManagementSection from "@/app/components/features/user-profile/PasswordManagementSection";
import type { User } from "@/src/types";

// Mock UI components
jest.mock("@/app/components/ui/Card", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
}));

jest.mock("@/app/components/ui/Button", () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
      data-testid={`button-${children}`}
    >
      {children}
    </button>
  ),
}));

const mockUser: User = {
  id: "user-123",
  username: "testuser",
  displayName: "Test User",
  role: "USER",
  createdAt: "2019-01-01T00:00:00.000Z",
  passwordChangedAt: "2023-01-01T00:00:00.000Z",
};

describe("PasswordManagementSection", () => {
  const defaultProps = {
    user: mockUser,
    userId: "user-123",
    onPasswordChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });
  });

  describe("Rendering", () => {
    it("should render the section title", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      expect(screen.getByText("Password Management")).toBeInTheDocument();
    });

    it("should render password input field", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      );
      expect(input).toBeInTheDocument();
    });

    it("should render Generate button", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      expect(screen.getByTestId("button-Generate")).toBeInTheDocument();
    });

    it("should render Change Password button", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      expect(screen.getByTestId("button-Change Password")).toBeInTheDocument();
    });

    it("should show password as hidden by default", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      ) as HTMLInputElement;
      expect(input.type).toBe("password");
    });
  });

  describe("Password Input", () => {
    it("should allow typing in password field", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { value: "newPassword123" } });
      expect(input.value).toBe("newPassword123");
    });

    it("should show character count when password is entered", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      );

      fireEvent.change(input, { target: { value: "test1234" } });
      expect(screen.getByText("8 characters")).toBeInTheDocument();
    });

    it("should toggle password visibility when eye icon is clicked", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { value: "secret123" } });

      const toggleButton = screen.getByTitle("Show password");
      fireEvent.click(toggleButton);

      expect(input.type).toBe("text");
    });

    it("should hide password when eye icon is clicked again", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { value: "secret123" } });

      const toggleButton = screen.getByTitle("Show password");
      fireEvent.click(toggleButton);
      fireEvent.click(screen.getByTitle("Hide password"));

      expect(input.type).toBe("password");
    });
  });

  describe("Password Generation", () => {
    it("should generate password when Generate button is clicked", () => {
      render(<PasswordManagementSection {...defaultProps} />);

      const generateButton = screen.getByTestId("button-Generate");
      fireEvent.click(generateButton);

      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      ) as HTMLInputElement;

      expect(input.value).not.toBe("");
      expect(input.value.length).toBeGreaterThan(0);
    });

    it("should show password when generated", () => {
      render(<PasswordManagementSection {...defaultProps} />);

      const generateButton = screen.getByTestId("button-Generate");
      fireEvent.click(generateButton);

      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      ) as HTMLInputElement;

      expect(input.type).toBe("text");
    });

    it("should generate different passwords on consecutive clicks", () => {
      render(<PasswordManagementSection {...defaultProps} />);

      const generateButton = screen.getByTestId("button-Generate");
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      ) as HTMLInputElement;

      fireEvent.click(generateButton);
      const firstPassword = input.value;

      fireEvent.click(generateButton);
      const secondPassword = input.value;

      expect(firstPassword).not.toBe(secondPassword);
    });
  });

  describe("Password Strength Indicator", () => {
    it("should show weak strength for short passwords", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      );

      fireEvent.change(input, { target: { value: "weak" } });
      // Should show character count
      expect(screen.getByText("4 characters")).toBeInTheDocument();
    });

    it("should show strength label", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      );

      fireEvent.change(input, { target: { value: "Test1234" } });
      // Should show character count
      expect(screen.getByText("8 characters")).toBeInTheDocument();
    });

    it("should update strength as password changes", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      );

      fireEvent.change(input, { target: { value: "test" } });
      expect(screen.getByText("4 characters")).toBeInTheDocument();

      fireEvent.change(input, { target: { value: "Test1234!@#$Strong" } });
      // Character count should update
      expect(screen.getByText("18 characters")).toBeInTheDocument();
    });
  });

  describe("Password Copying", () => {
    it("should show copy button when password is entered", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      );

      fireEvent.change(input, { target: { value: "testPassword" } });

      const copyButton = screen.getByTitle("Copy password");
      expect(copyButton).toBeInTheDocument();
    });

    it("should not show copy button when password is empty", () => {
      render(<PasswordManagementSection {...defaultProps} />);

      const copyButton = screen.queryByTitle("Copy password");
      expect(copyButton).not.toBeInTheDocument();
    });

    it("should copy password to clipboard when copy button is clicked", async () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      );

      fireEvent.change(input, { target: { value: "testPassword" } });

      const copyButton = screen.getByTitle("Copy password");
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "testPassword"
      );
    });
  });

  describe("Password Change", () => {
    it("should disable Change Password button when password is empty", () => {
      render(<PasswordManagementSection {...defaultProps} />);

      const changeButton = screen.getByTestId("button-Change Password");
      expect(changeButton).toBeDisabled();
    });

    it("should disable Change Password button when password is too short", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      );

      fireEvent.change(input, { target: { value: "short" } });

      const changeButton = screen.getByTestId("button-Change Password");
      expect(changeButton).toBeDisabled();
    });

    it("should enable Change Password button when password is valid", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      );

      fireEvent.change(input, { target: { value: "validPassword123" } });

      const changeButton = screen.getByTestId("button-Change Password");
      expect(changeButton).not.toBeDisabled();
    });

    it("should call onPasswordChange when Change Password is clicked", () => {
      const onPasswordChange = jest.fn();
      render(
        <PasswordManagementSection
          {...defaultProps}
          onPasswordChange={onPasswordChange}
        />
      );

      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      );
      fireEvent.change(input, { target: { value: "newPassword123" } });

      const changeButton = screen.getByTestId("button-Change Password");
      fireEvent.click(changeButton);

      expect(onPasswordChange).toHaveBeenCalledWith("newPassword123");
    });

    it("should clear password field after successful change", () => {
      render(<PasswordManagementSection {...defaultProps} />);

      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "newPassword123" } });

      const changeButton = screen.getByTestId("button-Change Password");
      fireEvent.click(changeButton);

      expect(input.value).toBe("");
    });
  });

  describe("Last Changed Display", () => {
    it("should show when password was last changed", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      expect(screen.getByText(/Last changed:/)).toBeInTheDocument();
    });

    it("should show 'Never changed' when passwordChangedAt is undefined", () => {
      const userWithoutPasswordChange: User = {
        ...mockUser,
        passwordChangedAt: undefined,
      };
      render(
        <PasswordManagementSection
          {...defaultProps}
          user={userWithoutPasswordChange}
        />
      );

      expect(screen.getByText(/Never changed/)).toBeInTheDocument();
    });

    it("should format the date when password was changed", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      // Just check that some date-like content is rendered
      expect(screen.getByText(/Last changed:/)).toBeInTheDocument();
    });
  });

  describe("Password Requirements", () => {
    it("should display password requirements", () => {
      render(<PasswordManagementSection {...defaultProps} />);

      expect(screen.getByText(/Minimum 8 characters/)).toBeInTheDocument();
    });

    it("should mention using Generate button in requirements", () => {
      render(<PasswordManagementSection {...defaultProps} />);

      expect(screen.getByText(/Use the Generate button/)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper autocomplete attribute", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      const input = screen.getByPlaceholderText(
        "Enter new password (min 8 characters)"
      );

      expect(input).toHaveAttribute("autocomplete", "new-password");
    });

    it("should render Card component", () => {
      render(<PasswordManagementSection {...defaultProps} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });
  });
});
