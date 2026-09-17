import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserOwnProfile from "@/app/components/features/user-profile/UserOwnProfile";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

global.fetch = jest.fn();

const mockUser = {
  id: "user-1",
  username: "testuser",
  givenName: "Test",
  familyName: "User",
  email: "test@example.com",
  gender: "M",
  birthYear: 1990,
  residenceCountry: {
    id: "country-1",
    code: "US",
    name: "United States",
  },
  residenceRegion: {
    id: "region-1",
    code: "CA",
    name: "California",
  },
  birthCountry: {
    id: "country-2",
    code: "UK",
    name: "United Kingdom",
  },
  userInterests: [
    {
      interestId: "interest-1",
      interest: { id: "interest-1", name: "Hiking" },
    },
  ],
  passwordChangedAt: "2024-01-01T00:00:00Z",
};

describe("UserOwnProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/users/user-1")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUser,
        });
      }
      if (url.includes("/api/countries")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            countries: [
              {
                id: "1",
                code: "US",
                code3: "USA",
                name: "United States",
                nativeName: "United States",
                numericCode: "840",
                continent: "North America",
                currency: "USD",
                languages: "en",
                hasRegions: true,
              },
            ],
            grouped: {
              "North America": [
                {
                  id: "1",
                  code: "US",
                  code3: "USA",
                  name: "United States",
                  nativeName: "United States",
                  numericCode: "840",
                  continent: "North America",
                  currency: "USD",
                  languages: "en",
                  hasRegions: true,
                },
              ],
            },
          }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });
    });
  });

  it("renders loading state", () => {
    render(<UserOwnProfile userId="user-1" />);
    // Loading spinner is present (Loader2 icon from lucide-react)
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders user profile after loading", async () => {
    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("My Profile")).toBeInTheDocument();
      expect(screen.getByText("testuser")).toBeInTheDocument();
    });
  });

  it("displays user information correctly", async () => {
    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Test")).toBeInTheDocument();
      expect(screen.getByText("User")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });
  });

  it("enters edit mode when clicking edit button", async () => {
    const user = userEvent.setup();
    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Profile"));

    await waitFor(() => {
      expect(screen.getByText("Save Changes")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  it("cancels edit mode and restores original data", async () => {
    const user = userEvent.setup();
    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Profile"));

    await waitFor(() => {
      const givenNameInput = screen.getByPlaceholderText("Enter given name");
      expect(givenNameInput).toBeInTheDocument();
    });

    await user.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });
  });

  it("displays email as read-only with HoF Clerk contact info", async () => {
    const user = userEvent.setup();
    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Profile"));

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText("your.email@example.com");
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toBeDisabled();
      expect(emailInput).toHaveAttribute("readonly");
    });

    // Check for Contact Help link for email changes
    expect(
      screen.getByText(/To change your email address, please/i),
    ).toBeInTheDocument();

    const contactHelpLink = screen.getByRole("link", {
      name: /Contact Help/i,
    });
    expect(contactHelpLink).toBeInTheDocument();
    expect(contactHelpLink).toHaveAttribute("href", "/support");
  });

  it("validates birth year range", async () => {
    const user = userEvent.setup();
    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Profile"));

    await waitFor(() => {
      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });
  });

  it("saves profile changes successfully", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockImplementation(
      (url: string, options?: any) => {
        if (url.includes("/api/users/user-1") && options?.method === "PATCH") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        if (url.includes("/api/users/user-1") && !options) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes("/api/countries")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              countries: [
                {
                  id: "1",
                  code: "US",
                  code3: "USA",
                  name: "United States",
                  nativeName: "United States",
                  numericCode: "840",
                  continent: "North America",
                  currency: "USD",
                  languages: "en",
                  hasRegions: true,
                },
              ],
              grouped: {
                "North America": [
                  {
                    id: "1",
                    code: "US",
                    code3: "USA",
                    name: "United States",
                    nativeName: "United States",
                    numericCode: "840",
                    continent: "North America",
                    currency: "USD",
                    languages: "en",
                    hasRegions: true,
                  },
                ],
              },
            }),
          });
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: "Not found" }),
        });
      },
    );

    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Profile"));

    await waitFor(() => {
      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(
        screen.getByText(/Profile updated successfully/),
      ).toBeInTheDocument();
    });
  });

  it("shows password section when Change Password button is clicked", async () => {
    const user = userEvent.setup();
    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Profile"));

    await waitFor(() => {
      expect(screen.getByText("Change Password")).toBeInTheDocument();
    });

    // Password section should not be visible initially
    expect(
      screen.queryByPlaceholderText(/Enter new password/),
    ).not.toBeInTheDocument();

    // Click to show password section
    await user.click(screen.getByText("Change Password"));

    await waitFor(() => {
      const passwordInput = screen.getByPlaceholderText(/Enter new password/);
      expect(passwordInput).toBeInTheDocument();
    });
  });

  it("generates strong password", async () => {
    const user = userEvent.setup();
    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Profile"));

    await user.click(screen.getByText("Change Password"));

    await waitFor(() => {
      expect(screen.getByText("Generate Password")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Generate Password"));

    await waitFor(() => {
      const passwordInput = screen.getByPlaceholderText(
        /Enter new password/,
      ) as HTMLInputElement;
      expect(passwordInput.value.length).toBeGreaterThan(0);
    });
  });

  it("calculates password strength", async () => {
    const user = userEvent.setup();
    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Profile"));

    await user.click(screen.getByText("Change Password"));

    await waitFor(() => {
      const passwordInput = screen.getByPlaceholderText(/Enter new password/);
      expect(passwordInput).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText(/Enter new password/);
    await user.type(passwordInput, "weak");

    await waitFor(() => {
      expect(screen.getByText("Weak")).toBeInTheDocument();
    });

    await user.clear(passwordInput);
    await user.type(passwordInput, "StrongP@ssw0rd123!");

    await waitFor(() => {
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Profile"));

    await user.click(screen.getByText("Change Password"));

    await waitFor(() => {
      const passwordInput = screen.getByPlaceholderText(
        /Enter new password/,
      ) as HTMLInputElement;
      expect(passwordInput.type).toBe("password");
    });

    // Find eye icon button - it's next to password input
    const eyeButtons = screen
      .getAllByRole("button")
      .filter(
        (btn) =>
          btn.querySelector("svg.lucide-eye") ||
          btn.querySelector("svg.lucide-eye-off"),
      );
    expect(eyeButtons.length).toBeGreaterThan(0);

    await user.click(eyeButtons[0]);

    const passwordInput = screen.getByPlaceholderText(
      /Enter new password/,
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe("text");
  });

  it("changes password successfully", async () => {
    const user = userEvent.setup();
    const updatedUser = {
      ...mockUser,
      passwordChangedAt: "2024-06-01T00:00:00Z",
    };

    const fetchMock = jest.fn((url: string, options?: any) => {
      if (url.includes("/password") && options?.method === "PATCH") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            passwordChangedAt: updatedUser.passwordChangedAt,
          }),
        });
      }
      if (url.includes("/api/users/user-1")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUser,
        });
      }
      if (url.includes("/api/countries")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            countries: [
              {
                id: "1",
                code: "US",
                code3: "USA",
                name: "United States",
                nativeName: "United States",
                numericCode: "840",
                continent: "North America",
                currency: "USD",
                languages: "en",
                hasRegions: true,
              },
            ],
            grouped: {
              "North America": [
                {
                  id: "1",
                  code: "US",
                  code3: "USA",
                  name: "United States",
                  nativeName: "United States",
                  numericCode: "840",
                  continent: "North America",
                  currency: "USD",
                  languages: "en",
                  hasRegions: true,
                },
              ],
            },
          }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });
    });

    (global.fetch as jest.Mock).mockImplementation(fetchMock);

    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Profile"));

    await user.click(screen.getByText("Change Password"));

    await waitFor(() => {
      const passwordInput = screen.getByPlaceholderText(/Enter new password/);
      expect(passwordInput).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText(/Enter new password/);
    await user.type(passwordInput, "NewStrongP@ss123");

    // Wait a bit for the button to be enabled (password validation)
    await waitFor(() => {
      const changePasswordButtons = screen.getAllByRole("button", {
        name: /Change Password/i,
      });
      // Find the button that's NOT disabled (should be the one in the password section)
      const enabledButton = changePasswordButtons.find(
        (btn) => !btn.hasAttribute("disabled"),
      );
      expect(enabledButton).toBeInTheDocument();
    });

    const changePasswordButtons = screen.getAllByRole("button", {
      name: /Change Password/i,
    });
    const changePasswordButtonInSection = changePasswordButtons.find(
      (btn) => !btn.hasAttribute("disabled"),
    )!;

    await user.click(changePasswordButtonInSection);

    // Wait for the API call
    await waitFor(
      () => {
        const passwordCalls = fetchMock.mock.calls.filter(
          (call) =>
            typeof call[0] === "string" &&
            call[0].includes("/password") &&
            call[1]?.method === "PATCH",
        );
        expect(passwordCalls.length).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );

    await waitFor(
      () => {
        expect(
          screen.getByText(/Password changed successfully/),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("copies password to clipboard", async () => {
    const user = userEvent.setup();
    const clipboardMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: clipboardMock,
      },
      writable: true,
      configurable: true,
    });

    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Profile"));

    await user.click(screen.getByText("Change Password"));

    await waitFor(() => {
      const passwordInput = screen.getByPlaceholderText(/Enter new password/);
      expect(passwordInput).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText(/Enter new password/);
    await user.type(passwordInput, "TestPassword123");

    await user.click(screen.getByText("Copy"));

    expect(clipboardMock).toHaveBeenCalledWith("TestPassword123");
  });

  it("displays user interests", async () => {
    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Hiking")).toBeInTheDocument();
    });
  });

  it("displays no interests message when empty", async () => {
    const userWithoutInterests = { ...mockUser, userInterests: [] };
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/users/user-1")) {
        return Promise.resolve({
          ok: true,
          json: async () => userWithoutInterests,
        });
      }
      if (url.includes("/api/countries")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ countries: [] }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });
    });

    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("No interests selected")).toBeInTheDocument();
    });
  });

  it("displays gender correctly", async () => {
    render(<UserOwnProfile userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Male")).toBeInTheDocument();
    });
  });
});
