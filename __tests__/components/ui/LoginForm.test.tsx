import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginForm from "@/app/components/ui/LoginForm";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/app/components/ui/Logo", () => {
  return function MockLogo() {
    return <div data-testid="logo">Logo</div>;
  };
});

jest.mock("@/app/components/ui/TurnstileWidget", () => {
  return function MockTurnstileWidget({
    onReady,
    onToken,
  }: {
    onReady?: (ready: boolean) => void;
    onToken?: (token: string) => void;
  }) {
    React.useEffect(() => {
      // Simulate Turnstile widget ready
      onReady?.(true);
      onToken?.("test-turnstile-token");
    }, [onReady, onToken]);
    return <div data-testid="turnstile-widget" />;
  };
});

describe("LoginForm Component", () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    } as any);
    mockSignIn.mockResolvedValue({ ok: true, error: null } as any);
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render the login form", () => {
      render(<LoginForm />);
      expect(
        screen.getByPlaceholderText("name@example.com or yourusername")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter your password")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it("should render the Logo component", () => {
      render(<LoginForm />);
      expect(screen.getByTestId("logo")).toBeInTheDocument();
    });

    it("should render username input with autocomplete", () => {
      render(<LoginForm />);
      const usernameInput = screen.getByPlaceholderText(
        "name@example.com or yourusername"
      );
      expect(usernameInput).toHaveAttribute("autocomplete", "username");
    });

    it("should render password input with autocomplete", () => {
      render(<LoginForm />);
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
    });

    it("should render password input as type password by default", () => {
      render(<LoginForm />);
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("should have required attributes on inputs", () => {
      render(<LoginForm />);
      expect(
        screen.getByPlaceholderText("name@example.com or yourusername")
      ).toBeRequired();
      expect(screen.getByPlaceholderText("Enter your password")).toBeRequired();
    });
  });

  describe("Password Visibility Toggle", () => {
    it("should toggle password visibility", () => {
      render(<LoginForm />);
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const toggleButton = screen.getByRole("button", {
        name: "Show password",
      });

      expect(passwordInput).toHaveAttribute("type", "password");

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "text");

      const hideButton = screen.getByRole("button", { name: "Hide password" });
      fireEvent.click(hideButton);
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("should show eye icon when password is hidden", () => {
      render(<LoginForm />);
      const toggleButton = screen.getByRole("button", {
        name: "Show password",
      });
      const svg = toggleButton.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should show eye-off icon when password is visible", () => {
      render(<LoginForm />);
      const toggleButton = screen.getByRole("button", {
        name: "Show password",
      });

      fireEvent.click(toggleButton);

      const hideButton = screen.getByRole("button", { name: "Hide password" });
      const svg = hideButton.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should maintain toggle button position", () => {
      render(<LoginForm />);
      const toggleButton = screen.getByRole("button", {
        name: "Show password",
      });
      expect(toggleButton).toHaveClass("absolute", "right-3", "top-1/2");
    });
  });

  describe("Authentication Flow", () => {
    beforeEach(() => {
      // Mock Turnstile
      (window as any).turnstile = {
        getResponse: jest.fn(() => "test-turnstile-token"),
        reset: jest.fn(),
      };

      // Mock document.querySelector for cf-turnstile-response
      const mockInput = document.createElement("input");
      mockInput.name = "cf-turnstile-response";
      mockInput.value = "test-turnstile-token";
      document.body.appendChild(mockInput);
    });

    afterEach(() => {
      // Cleanup
      const input = document.querySelector('[name="cf-turnstile-response"]');
      if (input) document.body.removeChild(input);
      delete (window as any).turnstile;
    });

    it("should call signIn with credentials on form submit", async () => {
      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "testpass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          username: "testuser",
          password: "testpass",
          turnstileToken: "test-turnstile-token",
          redirect: false,
        });
      });
    });

    it("should navigate to home on successful login", async () => {
      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "testpass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/home");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("should show error message on authentication failure", async () => {
      mockSignIn.mockResolvedValueOnce({
        ok: false,
        error: "Invalid credentials",
      } as any);

      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "wrongpass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/Incorrect email\/username or password/i)
        ).toBeInTheDocument();
      });
    });

    it("should show generic error on exception", async () => {
      mockSignIn.mockRejectedValueOnce(new Error("Network error"));

      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "testpass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/Unable to sign in/i)).toBeInTheDocument();
      });
    });

    it("should not clear error message when user starts typing (error persists until resubmit)", async () => {
      mockSignIn.mockResolvedValueOnce({
        ok: false,
        error: "Invalid credentials",
      } as any);

      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "wrongpass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/Incorrect email\/username or password/i)
        ).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "newuser" },
        }
      );

      // Error should still be visible (component doesn't clear on input change)
      expect(
        screen.getByText(/Incorrect email\/username or password/i)
      ).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading state during sign in", async () => {
      mockSignIn.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ ok: true, error: null } as any), 100);
          })
      );

      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "testpass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText("Signing In...")).toBeInTheDocument();
      });
    });

    it("should disable inputs during loading", async () => {
      mockSignIn.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ ok: true, error: null } as any), 100);
          })
      );

      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "testpass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("name@example.com or yourusername")
        ).toBeDisabled();
        expect(
          screen.getByPlaceholderText("Enter your password")
        ).toBeDisabled();
      });
    });

    it("should disable submit button during loading", async () => {
      mockSignIn.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ ok: true, error: null } as any), 100);
          })
      );

      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "testpass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: /signing in/i,
        });
        expect(submitButton).toBeDisabled();
      });
    });

    it("should re-enable form after loading completes", async () => {
      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "testpass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("name@example.com or yourusername")
        ).not.toBeDisabled();
        expect(
          screen.getByPlaceholderText("Enter your password")
        ).not.toBeDisabled();
      });
    });
  });

  describe("Form Validation", () => {
    it("should not submit with empty username", () => {
      render(<LoginForm />);

      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "testpass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("should not submit with empty password", () => {
      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("should prevent default form submission", () => {
      render(<LoginForm />);

      const form = screen
        .getByRole("button", { name: /sign in/i })
        .closest("form");
      const submitEvent = new Event("submit", {
        bubbles: true,
        cancelable: true,
      });

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "testpass" },
      });

      form?.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
    });
  });

  describe("Styling and Layout", () => {
    it("should have gradient background container", () => {
      const { container } = render(<LoginForm />);
      const bgDiv = container.querySelector(".bg-linear-to-br");
      expect(bgDiv).toBeInTheDocument();
    });

    it("should apply error styling to error message", async () => {
      mockSignIn.mockResolvedValueOnce({
        ok: false,
        error: "Invalid credentials",
      } as any);

      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "wrongpass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        const errorDiv = screen
          .getByText(/Incorrect email\/username or password/i)
          .closest("div");
        expect(errorDiv).toHaveClass("bg-red-900/30", "border-red-500/30");
      });
    });

    it("should apply correct button styling", () => {
      render(<LoginForm />);
      const button = screen.getByRole("button", { name: /sign in/i });
      expect(button).toHaveClass("w-full", "bg-linear-to-r");
    });
  });

  describe("Edge Cases", () => {
    it("should handle router navigation failure", async () => {
      mockPush.mockImplementationOnce(() => {
        throw new Error("Navigation failed");
      });

      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "testuser" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "testpass" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      // Navigation error is caught and shown as generic error
      await waitFor(() => {
        expect(screen.getByText(/Unable to sign in/i)).toBeInTheDocument();
      });
    });

    it("should handle empty credentials", async () => {
      render(<LoginForm />);

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("should handle whitespace-only credentials", async () => {
      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "   " },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "   " },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          username: "   ",
          password: "   ",
          turnstileToken: "test-turnstile-token",
          redirect: false,
        });
      });
    });

    it("should handle special characters in credentials", async () => {
      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText("name@example.com or yourusername"),
        {
          target: { value: "user@example.com" },
        }
      );
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "p@$$w0rd!" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          username: "user@example.com",
          password: "p@$$w0rd!",
          turnstileToken: "test-turnstile-token",
          redirect: false,
        });
      });
    });
  });
});
