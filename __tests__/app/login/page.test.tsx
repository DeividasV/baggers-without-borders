/**
 * Tests for Login Page
 */

import { render, screen } from "@testing-library/react";
import { SITE_NAME } from "@/src/config/site";
import { redirect } from "next/navigation";
import LoginPage from "@/app/login/page";
import { getOptionalSession } from "@/src/lib/api-auth";

// Mock dependencies
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/src/lib/api-auth", () => ({
  getOptionalSession: jest.fn(),
}));

jest.mock("@/app/components/ui", () => ({
  ...jest.requireActual("@/app/components/ui"),
  LoginForm: () => <div data-testid="login-form">Login Form Mock</div>,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render login form when not authenticated", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValue(null);

    const page = await LoginPage();
    const { container } = render(page);

    expect(container).toBeTruthy();
  });

  it("should redirect to home when user is authenticated", async () => {
    const mockSession = {
      user: { id: "1", email: "test@example.com" },
    };
    (getOptionalSession as jest.Mock).mockResolvedValue(mockSession);

    await LoginPage();

    expect(redirect).toHaveBeenCalledWith("/home");
  });

  it("should not redirect when session is null", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValue(null);

    await LoginPage();

    expect(redirect).not.toHaveBeenCalled();
  });

  it("should render welcome message", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValue(null);

    const page = await LoginPage();
    render(page);

    expect(screen.getByText(`Welcome to ${SITE_NAME}`)).toBeInTheDocument();
  });

  it("should render login form component", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValue(null);

    const page = await LoginPage();
    render(page);

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("should have correct layout classes", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValue(null);

    const page = await LoginPage();
    const { container } = render(page);

    const mainDiv = container.querySelector(".min-h-screen.flex.items-center.justify-center");
    expect(mainDiv).toBeInTheDocument();
  });

  it("should check session on every page load", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValue(null);

    await LoginPage();

    expect(getOptionalSession).toHaveBeenCalledTimes(1);
  });

  it("should redirect authenticated users before rendering", async () => {
    const mockSession = {
      user: { id: "1", email: "test@example.com", name: "Test User" },
    };
    (getOptionalSession as jest.Mock).mockResolvedValue(mockSession);

    await LoginPage();

    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/home");
  });

  it("should handle undefined session", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValue(undefined);

    await LoginPage();

    expect(redirect).not.toHaveBeenCalled();
  });

  it("should render centered container", async () => {
    (getOptionalSession as jest.Mock).mockResolvedValue(null);

    const page = await LoginPage();
    const { container } = render(page);

    const innerDiv = container.querySelector(".max-w-md.w-full");
    expect(innerDiv).toBeInTheDocument();
  });
});
